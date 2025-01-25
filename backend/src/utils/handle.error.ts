import { NextFunction, Request, Response } from "express";

export class ClientError extends Error {
  public readonly details: object;
  constructor(message: string, details: object) {
    super(message);
    this.details = details;
  }
}

export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("Global Error:", error);
  res.status(500).json({ message: "Internal server error" });
};

export const standardErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ClientError) {
    return res.status(404).send({ error: err.message, details: err.details });
  }
  if (err instanceof Error) {
    return res.status(500).send({ error: err.message });
  }
  return res.status(500).json({ error: err });
};
