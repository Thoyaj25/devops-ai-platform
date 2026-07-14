import { NextResponse } from "next/server";

export const ApiResponse = {
  success(data: unknown, status = 200) {
    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status }
    );
  },

  error(message: string, status = 500, details?: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: message,
        details,
      },
      { status }
    );
  },
};