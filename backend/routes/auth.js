import express from "express";
import { supabase } from "../server.js";

const router = express.Router();

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required",
        success: false 
      });
    }

    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password 
    });

    if (error) {
      return res.status(400).json({ 
        error: error.message,
        success: false 
      });
    }

    res.status(201).json({ 
      message: "User created successfully",
      user: data.user,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      success: false 
    });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required",
        success: false 
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ 
        error: error.message,
        success: false 
      });
    }

    // Set HTTP-only cookie for session management
    res.cookie("access_token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ 
      message: "Login successful",
      session: data.session, 
      user: data.user,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      success: false 
    });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("access_token");
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ 
        error: error.message,
        success: false 
      });
    }

    res.json({ 
      message: "Logged out successfully",
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      success: false 
    });
  }
});

// Get current user (using cookie)
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.access_token;
    
    if (!token) {
      return res.status(401).json({ 
        error: "No authentication token found",
        success: false 
      });
    }

    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ 
        error: "Invalid or expired token",
        success: false 
      });
    }

    res.json({ 
      user: data.user,
      success: true 
    });
  } catch (error) {
    res.status(500).json({ 
      error: "Internal server error",
      success: false 
    });
  }
});

export default router;
