"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { usernameToStudentEmail } from "@/lib/auth/student-email"

export async function loginStaff(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Email atau password salah." }
  }

  redirect("/ujian")
}

export async function loginStudent(_prevState: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "")
  const password = String(formData.get("password") ?? "")

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToStudentEmail(username),
    password,
  })

  if (error) {
    return { error: "Username atau password salah." }
  }

  redirect("/beranda")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
