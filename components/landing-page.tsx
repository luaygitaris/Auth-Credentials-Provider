"use client"

import Link from "next/link"
import { useState } from "react"
import { FaComments, FaGoogle } from "react-icons/fa"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoginForm from "@/components/auth/login-form"
import RegisterForm from "@/components/auth/register-form"

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center justify-center">
          <FaComments className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold">ChatApp</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Connect with friends in real-time
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Our secure and fast chat platform lets you stay connected with friends and colleagues anywhere,
                  anytime.
                </p>
              </div>
              <div className="mx-auto w-full max-w-md space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl text-center">Welcome</CardTitle>
                    <CardDescription className="text-center">
                      Sign in to your account or create a new one
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                      </TabsList>
                      <TabsContent value="login">
                        <LoginForm />
                      </TabsContent>
                      <TabsContent value="register">
                        <RegisterForm setActiveTab={setActiveTab} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" type="button">
                      <FaGoogle className="mr-2 h-4 w-4" />
                      Google
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
