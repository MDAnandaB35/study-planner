import express from "express";
import axios from "axios";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /ai/completion
// Body: { focus: string, outcome: string }
router.post("/complete", requireAuth, async (req, res) => {
  try {
    const { focus, outcome } = req.body;

    if (!focus || !outcome) {
      return res.status(400).json({
        success: false,
        error: "Fields 'focus' and 'outcome' are required"
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key not configured"
      });
    }

    // System prompt for strict JSON roadmap output
    const systemPrompt = `
      You are a professional study planner assistant.
      You always return your response as valid JSON only (no extra commentary).
      The JSON structure must follow this schema:

      {
        "planTitle": "string",
        "focus": "string",
        "outcome": "string",
        "estimatedDurationWeeks": number,
        "milestones": [
          {
            "title": "string",
            "description": "string",
            "estimatedDuration": "string",
            "steps": [
              {
                "title": "string",
                "description": "string",
                "resources": [
                  { "type": "link|video|book", "title": "string", "url": "string" }
                ]
              }
            ]
          }
        ]
      }
    `;

    // User-specific input
    const userPrompt = `
      Create a detailed study roadmap for the following:

      Focus: "${focus}"
      Expected Outcome: "${outcome}"

      Requirements:
      - Break the plan into clear milestones (3–6).
      - Each milestone must include:
        - A title
        - A description
        - An estimated duration (in weeks)
        - Multiple steps (each with a title + description)
      - Each step must include at least one recommended resource
        (type: link, video, or book).
      - The output must be strictly valid JSON matching the schema.
    `;

    // Call OpenAI Chat Completions API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4.1-nano-2025-04-14",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 1,
        max_completion_tokens: 5000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 60000
      }
    );

    // Safely extract the assistant message
    const message = response?.data?.choices?.[0]?.message;

    let roadmapJson = undefined;
    let rawText = undefined;

    if (typeof message?.content === "string") {
      rawText = message.content.trim();
    } else if (Array.isArray(message?.content)) {
      const jsonPart = message.content.find((part) => part?.type === "json_object" && part?.json);
      if (jsonPart?.json) {
        roadmapJson = jsonPart.json;
      } else {
        const textPart = message.content.find((part) => part?.type === "output_text" || part?.type === "text");
        if (textPart?.text) {
          rawText = String(textPart.text).trim();
        }
      }
    }

    if (!roadmapJson) {
      if (!rawText) {
        return res.status(500).json({
          success: false,
          error: "No content returned from model"
        });
      }
      try {
        roadmapJson = JSON.parse(rawText);
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: "Failed to parse AI response as JSON",
          raw: rawText
        });
      }
    }

    // Persist to Supabase: study_plans -> plan_milestones -> milestone_steps -> step_resources
    // Assumes tables exist with FKs: plan_milestones.plan_id -> study_plans.id, milestone_steps.milestone_id -> plan_milestones.id, step_resources.step_id -> milestone_steps.id
    const { planTitle, focus: planFocus, outcome: planOutcome, estimatedDurationWeeks, milestones } = roadmapJson || {};

    // 1) Insert plan
    const { data: planInsert, error: planError } = await req.app.get("supabase").from("study_plans").insert({
      user_id: req.user.id,
      title: planTitle || "Study Plan",
      focus: planFocus || String(focus),
      outcome: planOutcome || String(outcome),
      estimated_duration_weeks: Number(estimatedDurationWeeks) || null
    }).select().single();
    if (planError) {
      return res.status(500).json({ success: false, error: planError.message });
    }

    const planId = planInsert.id;

    // 2) Insert milestones
    const milestonesArray = Array.isArray(milestones) ? milestones : [];
    const milestoneRows = milestonesArray.map((m, index) => ({
      plan_id: planId,
      title: m?.title || `Milestone ${index + 1}`,
      description: m?.description || null,
      estimated_duration: m?.estimatedDuration || null,
      order_index: index
    }));
    let milestoneIdByIndex = new Map();
    if (milestoneRows.length > 0) {
      const { data: milestonesInserted, error: milestonesError } = await req.app.get("supabase").from("plan_milestones").insert(milestoneRows).select();
      if (milestonesError) {
        return res.status(500).json({ success: false, error: milestonesError.message });
      }
      milestonesInserted.forEach((row) => {
        milestoneIdByIndex.set(row.order_index, row.id);
      });
    }

    // 3) Insert steps and resources per milestone
    for (let i = 0; i < milestonesArray.length; i++) {
      const milestone = milestonesArray[i];
      const milestoneId = milestoneIdByIndex.get(i);
      const stepsArray = Array.isArray(milestone?.steps) ? milestone.steps : [];

      const stepRows = stepsArray.map((s, stepIndex) => ({
        milestone_id: milestoneId,
        title: s?.title || `Step ${stepIndex + 1}`,
        description: s?.description || null,
        order_index: stepIndex
      }));

      let stepIdByIndex = new Map();
      if (stepRows.length > 0) {
        const { data: stepsInserted, error: stepsError } = await req.app.get("supabase").from("milestone_steps").insert(stepRows).select();
        if (stepsError) {
          return res.status(500).json({ success: false, error: stepsError.message });
        }
        stepsInserted.forEach((row) => {
          stepIdByIndex.set(row.order_index, row.id);
        });
      }

      // Resources
      for (let j = 0; j < stepsArray.length; j++) {
        const step = stepsArray[j];
        const stepId = stepIdByIndex.get(j);
        const resourcesArray = Array.isArray(step?.resources) ? step.resources : [];
        const resourceRows = resourcesArray.map((r, resIndex) => ({
          step_id: stepId,
          type: r?.type || null,
          title: r?.title || null,
          url: r?.url || null,
          order_index: resIndex
        }));
        if (resourceRows.length > 0) {
          const { error: resourcesError } = await req.app.get("supabase").from("step_resources").insert(resourceRows);
          if (resourcesError) {
            return res.status(500).json({ success: false, error: resourcesError.message });
          }
        }
      }
    }

    return res.json({
      success: true,
      planId,
      title: planInsert.title
    });

  } catch (error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "OpenAI request failed";
    return res.status(status).json({ success: false, error: message });
  }
});

// PUT /ai/plans/:id - update plan basic info (title, focus, outcome, duration)
router.put("/plans/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const planId = req.params.id;
    const { title, focus, outcome, estimated_duration_weeks } = req.body;

    // Verify plan ownership
    const { data: existingPlan, error: checkError } = await supabase
      .from("study_plans")
      .select("id, user_id")
      .eq("id", planId)
      .eq("user_id", req.user.id)
      .single();
    
    if (checkError || !existingPlan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Update plan
    const { data, error } = await supabase
      .from("study_plans")
      .update({
        title: title || null,
        focus: focus || null,
        outcome: outcome || null,
        estimated_duration_weeks: estimated_duration_weeks || null
      })
      .eq("id", planId)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, plan: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /ai/plans/:id - delete plan and all related data
router.delete("/plans/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const planId = req.params.id;

    // Verify plan ownership
    const { data: existingPlan, error: checkError } = await supabase
      .from("study_plans")
      .select("id, user_id")
      .eq("id", planId)
      .eq("user_id", req.user.id)
      .single();
    
    if (checkError || !existingPlan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Delete plan (cascade will handle related records)
    const { error } = await supabase
      .from("study_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", req.user.id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Plan deleted successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// MILESTONE CRUD OPERATIONS

// POST /ai/plans/:id/milestones - add new milestone to plan
router.post("/plans/:id/milestones", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const planId = req.params.id;
    const { title, description, estimated_duration } = req.body;

    // Verify plan ownership
    const { data: existingPlan, error: checkError } = await supabase
      .from("study_plans")
      .select("id, user_id")
      .eq("id", planId)
      .eq("user_id", req.user.id)
      .single();
    
    if (checkError || !existingPlan) {
      return res.status(404).json({ success: false, error: "Plan not found" });
    }

    // Get next order index
    const { data: lastMilestone } = await supabase
      .from("plan_milestones")
      .select("order_index")
      .eq("plan_id", planId)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = lastMilestone?.[0]?.order_index + 1 || 0;

    // Insert milestone
    const { data, error } = await supabase
      .from("plan_milestones")
      .insert({
        plan_id: planId,
        title: title || "New Milestone",
        description: description || null,
        estimated_duration: estimated_duration || null,
        order_index: nextOrder
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, milestone: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /ai/milestones/:id - update milestone
router.put("/milestones/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const milestoneId = req.params.id;
    const { title, description, estimated_duration } = req.body;

    // Verify milestone ownership through plan
    const { data: milestone, error: checkError } = await supabase
      .from("plan_milestones")
      .select(`
        id,
        study_plans!inner(user_id)
      `)
      .eq("id", milestoneId)
      .eq("study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !milestone) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    // Update milestone
    const { data, error } = await supabase
      .from("plan_milestones")
      .update({
        title: title || null,
        description: description || null,
        estimated_duration: estimated_duration || null
      })
      .eq("id", milestoneId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, milestone: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /ai/milestones/:id - delete milestone
router.delete("/milestones/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const milestoneId = req.params.id;

    // Verify milestone ownership through plan
    const { data: milestone, error: checkError } = await supabase
      .from("plan_milestones")
      .select(`
        id,
        study_plans!inner(user_id)
      `)
      .eq("id", milestoneId)
      .eq("study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !milestone) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    // Delete milestone (cascade will handle steps and resources)
    const { error } = await supabase
      .from("plan_milestones")
      .delete()
      .eq("id", milestoneId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Milestone deleted successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// STEP CRUD OPERATIONS

// POST /ai/milestones/:id/steps - add new step to milestone
router.post("/milestones/:id/steps", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const milestoneId = req.params.id;
    const { title, description } = req.body;

    // Verify milestone ownership through plan
    const { data: milestone, error: checkError } = await supabase
      .from("plan_milestones")
      .select(`
        id,
        study_plans!inner(user_id)
      `)
      .eq("id", milestoneId)
      .eq("study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !milestone) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    // Get next order index
    const { data: lastStep } = await supabase
      .from("milestone_steps")
      .select("order_index")
      .eq("milestone_id", milestoneId)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = lastStep?.[0]?.order_index + 1 || 0;

    // Insert step
    const { data, error } = await supabase
      .from("milestone_steps")
      .insert({
        milestone_id: milestoneId,
        title: title || "New Step",
        description: description || null,
        order_index: nextOrder
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, step: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /ai/steps/:id - update step
router.put("/steps/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const stepId = req.params.id;
    const { title, description } = req.body;

    // Verify step ownership through milestone and plan
    const { data: step, error: checkError } = await supabase
      .from("milestone_steps")
      .select(`
        id,
        plan_milestones!inner(
          study_plans!inner(user_id)
        )
      `)
      .eq("id", stepId)
      .eq("plan_milestones.study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !step) {
      return res.status(404).json({ success: false, error: "Step not found" });
    }

    // Update step
    const { data, error } = await supabase
      .from("milestone_steps")
      .update({
        title: title || null,
        description: description || null
      })
      .eq("id", stepId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, step: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /ai/steps/:id - delete step
router.delete("/steps/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const stepId = req.params.id;

    // Verify step ownership through milestone and plan
    const { data: step, error: checkError } = await supabase
      .from("milestone_steps")
      .select(`
        id,
        plan_milestones!inner(
          study_plans!inner(user_id)
        )
      `)
      .eq("id", stepId)
      .eq("plan_milestones.study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !step) {
      return res.status(404).json({ success: false, error: "Step not found" });
    }

    // Delete step (cascade will handle resources)
    const { error } = await supabase
      .from("milestone_steps")
      .delete()
      .eq("id", stepId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Step deleted successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// RESOURCE CRUD OPERATIONS

// POST /ai/steps/:id/resources - add new resource to step
router.post("/steps/:id/resources", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const stepId = req.params.id;
    const { type, title, url } = req.body;

    // Verify step ownership through milestone and plan
    const { data: step, error: checkError } = await supabase
      .from("milestone_steps")
      .select(`
        id,
        plan_milestones!inner(
          study_plans!inner(user_id)
        )
      `)
      .eq("id", stepId)
      .eq("plan_milestones.study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !step) {
      return res.status(404).json({ success: false, error: "Step not found" });
    }

    // Get next order index
    const { data: lastResource } = await supabase
      .from("step_resources")
      .select("order_index")
      .eq("step_id", stepId)
      .order("order_index", { ascending: false })
      .limit(1);

    const nextOrder = lastResource?.[0]?.order_index + 1 || 0;

    // Insert resource
    const { data, error } = await supabase
      .from("step_resources")
      .insert({
        step_id: stepId,
        type: type || "link",
        title: title || "New Resource",
        url: url || null,
        order_index: nextOrder
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, resource: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// PUT /ai/resources/:id - update resource
router.put("/resources/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const resourceId = req.params.id;
    const { type, title, url } = req.body;

    // Verify resource ownership through step, milestone and plan
    const { data: resource, error: checkError } = await supabase
      .from("step_resources")
      .select(`
        id,
        milestone_steps!inner(
          plan_milestones!inner(
            study_plans!inner(user_id)
          )
        )
      `)
      .eq("id", resourceId)
      .eq("milestone_steps.plan_milestones.study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !resource) {
      return res.status(404).json({ success: false, error: "Resource not found" });
    }

    // Update resource
    const { data, error } = await supabase
      .from("step_resources")
      .update({
        type: type || null,
        title: title || null,
        url: url || null
      })
      .eq("id", resourceId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, resource: data });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /ai/resources/:id - delete resource
router.delete("/resources/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const resourceId = req.params.id;

    // Verify resource ownership through step, milestone and plan
    const { data: resource, error: checkError } = await supabase
      .from("step_resources")
      .select(`
        id,
        milestone_steps!inner(
          plan_milestones!inner(
            study_plans!inner(user_id)
          )
        )
      `)
      .eq("id", resourceId)
      .eq("milestone_steps.plan_milestones.study_plans.user_id", req.user.id)
      .single();
    
    if (checkError || !resource) {
      return res.status(404).json({ success: false, error: "Resource not found" });
    }

    // Delete resource
    const { error } = await supabase
      .from("step_resources")
      .delete()
      .eq("id", resourceId);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, message: "Resource deleted successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /ai/plans/public - fetch all study plans from other users (exclude current user)
router.get("/plans/public", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    
    // Get all public plans (excluding current user)
    const { data: plans, error: plansError } = await supabase
      .from("study_plans")
      .select("id, title, focus, outcome, estimated_duration_weeks, created_at, user_id")
      .neq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (plansError) {
      return res.status(500).json({ success: false, error: plansError.message });
    }

    if (!plans || plans.length === 0) {
      return res.json({ success: true, plans: [] });
    }

    // Get user emails for the plans
    const userIds = [...new Set(plans.map(plan => plan.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("auth.users")
      .select("id, email")
      .in("id", userIds);

    if (usersError) {
      // If we can't get user emails, return plans without email info
      const plansWithoutEmails = plans.map(plan => ({
        id: plan.id,
        title: plan.title,
        focus: plan.focus,
        outcome: plan.outcome,
        estimated_duration_weeks: plan.estimated_duration_weeks,
        created_at: plan.created_at,
        author_email: 'Unknown'
      }));
      return res.json({ success: true, plans: plansWithoutEmails });
    }

    // Create a map of user_id to email
    const userEmailMap = {};
    (users || []).forEach(user => {
      userEmailMap[user.id] = user.email;
    });

    // Transform the data to include user email
    const plansWithUsers = plans.map(plan => ({
      id: plan.id,
      title: plan.title,
      focus: plan.focus,
      outcome: plan.outcome,
      estimated_duration_weeks: plan.estimated_duration_weeks,
      created_at: plan.created_at,
      author_email: userEmailMap[plan.user_id] || 'Unknown'
    }));

    return res.json({ success: true, plans: plansWithUsers });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /ai/plans/public/:id - fetch a specific public plan by ID (read-only, no ownership check)
router.get("/plans/public/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const planId = req.params.id;

    // Get the plan (any plan, not just user's own)
    const { data: plans, error: planErr } = await supabase
      .from("study_plans")
      .select("id, title, focus, outcome, estimated_duration_weeks, created_at, user_id")
      .eq("id", planId)
      .limit(1);
    if (planErr) return res.status(500).json({ success: false, error: planErr.message });
    const plan = plans?.[0];
    if (!plan) return res.status(404).json({ success: false, error: "Plan not found" });

    // Get author email
    const { data: users, error: usersError } = await supabase
      .from("auth.users")
      .select("id, email")
      .eq("id", plan.user_id)
      .single();

    const authorEmail = users?.email || 'Unknown';

    // Get milestones
    const { data: milestones, error: msErr } = await supabase
      .from("plan_milestones")
      .select("id, title, description, estimated_duration, order_index")
      .eq("plan_id", plan.id)
      .order("order_index", { ascending: true });
    if (msErr) return res.status(500).json({ success: false, error: msErr.message });

    // Get steps
    const milestoneIds = (milestones || []).map(m => m.id);
    const { data: steps, error: stepsErr } = await supabase
      .from("milestone_steps")
      .select("id, milestone_id, title, description, order_index")
      .in("milestone_id", milestoneIds.length ? milestoneIds : ["00000000-0000-0000-0000-000000000000"])
      .order("order_index", { ascending: true });
    if (stepsErr) return res.status(500).json({ success: false, error: stepsErr.message });

    // Get resources
    const stepIds = (steps || []).map(s => s.id);
    const { data: resources, error: resErr } = await supabase
      .from("step_resources")
      .select("id, step_id, type, title, url, order_index")
      .in("step_id", stepIds.length ? stepIds : ["00000000-0000-0000-0000-000000000000"])
      .order("order_index", { ascending: true });
    if (resErr) return res.status(500).json({ success: false, error: resErr.message });

    // Compose the tree structure
    const stepsByMilestone = (steps || []).reduce((acc, s) => {
      acc[s.milestone_id] = acc[s.milestone_id] || [];
      acc[s.milestone_id].push({ ...s, resources: [] });
      return acc;
    }, {});

    const resourcesByStep = (resources || []).reduce((acc, r) => {
      acc[r.step_id] = acc[r.step_id] || [];
      acc[r.step_id].push(r);
      return acc;
    }, {});

    const milestonesWithSteps = (milestones || []).map(m => {
      const mSteps = (stepsByMilestone[m.id] || []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        order_index: s.order_index,
        resources: resourcesByStep[s.id] || []
      }));
      return { ...m, steps: mSteps };
    });

    const result = {
      id: plan.id,
      title: plan.title,
      focus: plan.focus,
      outcome: plan.outcome,
      estimated_duration_weeks: plan.estimated_duration_weeks,
      created_at: plan.created_at,
      author_email: authorEmail,
      milestones: milestonesWithSteps
    };
    return res.json({ success: true, plan: result });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

export default router;

// GET /ai/plans/latest - fetch latest plan with nested data for current user
router.get("/plans/latest", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");

    // Latest plan for user
    const { data: plans, error: planErr } = await supabase
      .from("study_plans")
      .select("id, title, focus, outcome, estimated_duration_weeks, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    if (planErr) return res.status(500).json({ success: false, error: planErr.message });
    const plan = plans?.[0];
    if (!plan) return res.json({ success: true, plan: null });

    // Milestones
    const { data: milestones, error: msErr } = await supabase
      .from("plan_milestones")
      .select("id, title, description, estimated_duration, order_index")
      .eq("plan_id", plan.id)
      .order("order_index", { ascending: true });
    if (msErr) return res.status(500).json({ success: false, error: msErr.message });

    // Steps per milestone
    const milestoneIds = milestones.map(m => m.id);
    let steps = [];
    if (milestoneIds.length > 0) {
      const { data: stepsData, error: stepsErr } = await supabase
        .from("milestone_steps")
        .select("id, milestone_id, title, description, order_index")
        .in("milestone_id", milestoneIds)
        .order("order_index", { ascending: true });
      if (stepsErr) return res.status(500).json({ success: false, error: stepsErr.message });
      steps = stepsData || [];
    }

    // Resources per step
    const stepIds = steps.map(s => s.id);
    let resources = [];
    if (stepIds.length > 0) {
      const { data: resourcesData, error: resErr } = await supabase
        .from("step_resources")
        .select("id, step_id, type, title, url, order_index")
        .in("step_id", stepIds)
        .order("order_index", { ascending: true });
      if (resErr) return res.status(500).json({ success: false, error: resErr.message });
      resources = resourcesData || [];
    }

    // Compose tree
    const stepsByMilestone = steps.reduce((acc, s) => {
      acc[s.milestone_id] = acc[s.milestone_id] || [];
      acc[s.milestone_id].push({ ...s, resources: [] });
      return acc;
    }, {});

    const resourcesByStep = resources.reduce((acc, r) => {
      acc[r.step_id] = acc[r.step_id] || [];
      acc[r.step_id].push(r);
      return acc;
    }, {});

    const milestonesWithSteps = milestones.map(m => {
      const mSteps = (stepsByMilestone[m.id] || []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        order_index: s.order_index,
        resources: resourcesByStep[s.id] || []
      }));
      return { ...m, steps: mSteps };
    });

    const result = { ...plan, milestones: milestonesWithSteps };
    return res.json({ success: true, plan: result });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /ai/plans - list all plans for current user (summaries)
router.get("/plans", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const { data, error } = await supabase
      .from("study_plans")
      .select("id, title, focus, outcome, estimated_duration_weeks, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ success: false, error: error.message });
    return res.json({ success: true, plans: data || [] });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

// GET /ai/plans/:id - fetch plan by id with nested data (must belong to user)
router.get("/plans/:id", requireAuth, async (req, res) => {
  try {
    const supabase = req.app.get("supabase");
    const planId = req.params.id;

    const { data: plans, error: planErr } = await supabase
      .from("study_plans")
      .select("id, title, focus, outcome, estimated_duration_weeks, created_at, user_id")
      .eq("id", planId)
      .limit(1);
    if (planErr) return res.status(500).json({ success: false, error: planErr.message });
    const plan = plans?.[0];
    if (!plan || plan.user_id !== req.user.id) return res.status(404).json({ success: false, error: "Plan not found" });

    const { data: milestones, error: msErr } = await supabase
      .from("plan_milestones")
      .select("id, title, description, estimated_duration, order_index")
      .eq("plan_id", plan.id)
      .order("order_index", { ascending: true });
    if (msErr) return res.status(500).json({ success: false, error: msErr.message });

    const milestoneIds = (milestones || []).map(m => m.id);
    const { data: steps, error: stepsErr } = await supabase
      .from("milestone_steps")
      .select("id, milestone_id, title, description, order_index")
      .in("milestone_id", milestoneIds.length ? milestoneIds : ["00000000-0000-0000-0000-000000000000"]) // avoid error on empty
      .order("order_index", { ascending: true });
    if (stepsErr) return res.status(500).json({ success: false, error: stepsErr.message });

    const stepIds = (steps || []).map(s => s.id);
    const { data: resources, error: resErr } = await supabase
      .from("step_resources")
      .select("id, step_id, type, title, url, order_index")
      .in("step_id", stepIds.length ? stepIds : ["00000000-0000-0000-0000-000000000000"]) // avoid error on empty
      .order("order_index", { ascending: true });
    if (resErr) return res.status(500).json({ success: false, error: resErr.message });

    const stepsByMilestone = (steps || []).reduce((acc, s) => {
      acc[s.milestone_id] = acc[s.milestone_id] || [];
      acc[s.milestone_id].push({ ...s, resources: [] });
      return acc;
    }, {});

    const resourcesByStep = (resources || []).reduce((acc, r) => {
      acc[r.step_id] = acc[r.step_id] || [];
      acc[r.step_id].push(r);
      return acc;
    }, {});

    const milestonesWithSteps = (milestones || []).map(m => {
      const mSteps = (stepsByMilestone[m.id] || []).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        order_index: s.order_index,
        resources: resourcesByStep[s.id] || []
      }));
      return { ...m, steps: mSteps };
    });

    const result = {
      id: plan.id,
      title: plan.title,
      focus: plan.focus,
      outcome: plan.outcome,
      estimated_duration_weeks: plan.estimated_duration_weeks,
      created_at: plan.created_at,
      milestones: milestonesWithSteps
    };
    return res.json({ success: true, plan: result });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});
