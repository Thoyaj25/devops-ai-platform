import { NextResponse } from "next/server";


export function authErrorResponse(error: unknown) {

  if (
    error instanceof Error &&
    error.message === "UNAUTHORIZED"
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status:401,
      }
    );
  }


  if (
    error instanceof Error &&
    error.message === "FORBIDDEN"
  ) {
    return NextResponse.json(
      {
        error:"Forbidden",
      },
      {
        status:403,
      }
    );
  }


  return null;
}