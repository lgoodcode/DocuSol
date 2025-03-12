"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next-nprogress-bar";
import { AnimatePresence, motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { captureException } from "@sentry/nextjs";
import { AlertCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BoxBackground } from "@/components/layout/box-background";
import { DockerContainer } from "@/components/home/docker";
import { useState } from "react";

const signupSchema = z.object({
  firstName: z.string({
    required_error: "First name is required",
  }),
  lastName: z.string({
    required_error: "Last name is required",
  }),
  email: z
    .string({
      required_error: "Email is required",
    })
    .email({
      message: "Invalid email address",
    }),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, {
      message: "Password must be at least 8 characters long",
    }),
});

export function SignupContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const onSignupSubmit = async (data: z.infer<typeof signupSchema>) => {
    setError(null);

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          // Store in snake_case for database
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });

    if (signupError) {
      console.error(signupError);
      captureException(signupError);
      setError(signupError.message);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <main className="relative">
        <BoxBackground />
        <motion.div
          initial="hidden"
          animate="visible"
          transition={{
            duration: 1.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <DockerContainer />
        </motion.div>

        <div className="relative -top-10 z-30 flex min-h-dvh flex-col items-center justify-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/">
              <Image
                src="/img/branding/logo_full_light_1694x432.png"
                alt="logo"
                width={1694}
                height={432}
                priority
                className="max-w-md px-6"
              />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="w-full max-w-md"
          >
            <Card className="w-full p-6">
              <CardContent className="grid gap-6 p-0">
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Form {...signupForm}>
                  <form
                    onSubmit={signupForm.handleSubmit(onSignupSubmit)}
                    className="space-y-8"
                  >
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Enter your first name"
                              className="w-full pl-4"
                            />
                          </FormControl>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              placeholder="Enter your last name"
                              className="w-full pl-4"
                            />
                          </FormControl>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email"
                              className="w-full pl-4"
                            />
                          </FormControl>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="w-full">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter your password"
                              className="w-full pl-4"
                            />
                          </FormControl>
                          <FormMessage className="text-sm" />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      isLoading={signupForm.formState.isSubmitting}
                    >
                      Login
                    </Button>
                  </form>
                </Form>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Already have an account?
                  </span>
                  <Link
                    href="/login"
                    className="text-sm text-primary hover:underline"
                  >
                    Login
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </>
  );
}
