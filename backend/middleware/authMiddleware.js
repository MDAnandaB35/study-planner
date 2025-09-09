import { supabase } from "../server.js";

export async function requireAuth(req, res, next) {
  try {
    // Try to get token from cookie first, then from Authorization header
    const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: "No authentication token provided",
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

    req.user = data.user;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: "Authentication error",
      success: false 
    });
  }
}
