import { NextResponse } from "next/server"

import { z } from "zod"

import { prisma } from "@/lib/prisma"
import { hashSync } from "bcrypt-ts"

const registerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ message: "Invalid input", errors: validation.error.errors }, { status: 400 })
    }

    const { name, email, password } = validation.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = hashSync(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    })

    return NextResponse.json({ message: "User created successfully", userId: user.id }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
