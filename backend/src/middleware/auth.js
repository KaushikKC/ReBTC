// middleware/auth.js
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import { recoverPersonalSignature } from "eth-sig-util";

// Verify JWT token for API routes
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Verify wallet signature for authentication
export const verifySignature = (req, res, next) => {
  const { address, message, signature } = req.body;

  if (!address || !message || !signature) {
    return res
      .status(400)
      .json({ error: "Address, message and signature are required" });
  }

  try {
    // Recover address from signature
    const recoveredAddress = recoverPersonalSignature({
      data: ethers.utils.hashMessage(message),
      sig: signature,
    });

    // Check if recovered address matches claimed address
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    req.user = { address };
    next();
  } catch (error) {
    return res.status(400).json({ error: "Invalid signature format" });
  }
};
