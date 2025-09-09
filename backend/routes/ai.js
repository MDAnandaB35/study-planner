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
