import express, { Request, Response, NextFunction } from "express";

// Async wrapper function to handle errors in async route handlers
export const handleAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
