/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {motion} from "framer-motion";
import Input from "@/src/components/ui/input";
import Button from "@/src/components/ui/button";
import Link from "next/link";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useSignIn} from "@/src/hooks/use-auth";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {IMAGES} from "@/src/assets";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type SignInForm = z.infer<typeof SignInSchema>;

export default function SignInPage() {
  const SignInMutation = useSignIn();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<SignInForm>({
    resolver: zodResolver(SignInSchema),
  });

  const onSubmmit = async (data: SignInForm) => {
    SignInMutation.mutate(data, {
      onSuccess: (res: any) => {
        localStorage.setItem("accessToken", res.data.token);
        const userData = JSON.stringify(res.data.user);
        localStorage.setItem("userData", userData);
        toast.success("Sign in Successfully");
        return router.push("/dashboard");
      },
      onError: (error: any) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 dark:bg-zinc-950">
      {/* 📱 RESPONSIVE FIX: Ganti grid-cols-2 jadi grid-cols-1 di mobile, dan md:grid-cols-2 di desktop */}
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[550px]">
        {/* --- LEFT SIDE: HERO BRANDING (Sembunyi di Mobile) --- */}
        <div
          className="relative hidden md:flex flex-col justify-between p-10 text-white"
          style={{
            backgroundImage: "url(/auth/greenhouse.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay Gradient Elegan */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-950/85 via-green-900/75 to-green-700/60"></div>

          {/* Logo & Nama Baru */}
          <div className="relative z-10 flex items-center gap-3">
            <img
              src={IMAGES.logo}
              alt="UrKen Logo"
              className="w-8 h-8 object-contain bg-white/10 p-1 rounded-md backdrop-blur-sm"
            />
            <span className="text-xl font-extrabold tracking-wide">
              The Origin{" "}
              <span className="text-green-400 font-normal text-xs block -mt-1">
                UrKen Platform
              </span>
            </span>
          </div>

          {/* Copywriting Solusi IoT */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Endless IoT Solutions
            </h2>
            <p className="text-green-100/90 text-sm max-w-xs leading-relaxed font-light">
              Inkubasi ide-ide hebatmu menjadi solusi nyata. Kelola otomatisasi
              hardware, monitoring data, dan ekosistem IoT secara cerdas dan
              real-time.
            </p>
          </div>
        </div>

        {/* --- RIGHT SIDE: FORM SIGN IN (Selalu Tampil) --- */}
        <div className="flex items-center justify-center p-8 sm:p-12">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            className="w-full max-w-sm"
          >
            {/* Logo Tambahan Khusus Tampilan Mobile */}
            <div className="flex md:hidden flex-col items-center mb-6 gap-2">
              <img
                src={IMAGES.logo}
                alt="UrKen Logo"
                className="w-12 h-12 object-contain"
              />
              <span className="text-sm font-bold text-green-600 tracking-wider uppercase">
                The Origin UrKen
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-zinc-100">
                  Sign In
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Don&apos;t have an account yet?{" "}
                  <Link
                    href={"/signup"}
                    className="text-green-600 font-semibold hover:underline dark:text-green-400"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmmit)} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email Address"
                  {...register("email")}
                  error={errors.email?.message}
                />
                <Input
                  togglePassword
                  type="password"
                  placeholder="Password"
                  {...register("password")}
                  error={errors.password?.message}
                />

                <Button
                  type="submit"
                  disabled={SignInMutation.isPending}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200 rounded-xl shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  {SignInMutation.isPending
                    ? "Signing in to account..."
                    : "Sign in"}
                </Button>

                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 pt-2">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                  Secure Cloud Platform
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
