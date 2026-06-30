/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {motion} from "framer-motion";
import Input from "@/src/components/ui/input";
import Button from "@/src/components/ui/button";
import Link from "next/link";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useSignUp} from "@/src/hooks/use-auth";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

// 🚀 LOGO BRANDING URKEN
export const IMAGES = {
  logo: new URL("./logo/UrkenLogo.png", import.meta.url).href,
};

const SignUpSchema = z.object({
  name: z.string().min(2, "Fullname is required"),
  email: z.string().email("Invalid email address"), // 🛠️ FIX: Zod email validation
  password: z.string().min(8, "Password must be at least 8 characters"),
  greenhouseName: z.string().min(1, "Greenhouse name is required"),
  location: z.string().min(1, "Location is required"),
});

type SignUpForm = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  const SignUpMutation = useSignUp();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<SignUpForm>({
    resolver: zodResolver(SignUpSchema),
  });

  const onSubmmit = async (data: SignUpForm) => {
    SignUpMutation.mutate(data, {
      onSuccess: () => {
        toast.success("Account created successfully");
        router.push("/signin");
      },
      onError: (error: any) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 dark:bg-zinc-950">
      {/* 📱 RESPONSIVE FIX: grid-cols-1 di mobile, otomatis md:grid-cols-2 di layar desktop */}
      <div className="w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[650px]">
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
              Join the Innovation
            </h2>
            <p className="text-green-100/90 text-sm max-w-xs leading-relaxed font-light">
              Daftarkan dirimu dan mulai integrasikan ide cerdasmu ke dalam
              platform IoT serbaguna. Kelola monitoring sensor dan perangkat
              otomatisasi secara instan.
            </p>
          </div>
        </div>

        {/* --- RIGHT SIDE: FORM SIGN UP (Selalu Tampil) --- */}
        <div className="flex items-center justify-center p-6 sm:p-10 md:p-12 overflow-y-auto">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            className="w-full max-w-sm"
          >
            {/* Logo Tambahan Khusus Tampilan Mobile */}
            <div className="flex md:hidden flex-col items-center mb-4 gap-1">
              <img
                src={IMAGES.logo}
                alt="UrKen Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xs font-bold text-green-600 tracking-wider uppercase">
                The Origin UrKen
              </span>
            </div>

            <div className="space-y-5">
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-zinc-100">
                  Create an account
                </h1>
                <p className="text-sm text-gray-500 dark:text-zinc-400">
                  Already have an account?{" "}
                  <Link
                    href={"/signin"}
                    className="text-green-600 font-semibold hover:underline dark:text-green-400"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmmit)} className="space-y-3.5">
                <Input
                  placeholder="Full Name"
                  {...register("name")}
                  error={errors.name?.message}
                />
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
                <Input
                  placeholder="Greenhouse name"
                  {...register("greenhouseName")}
                  error={errors.greenhouseName?.message}
                />
                <Input
                  placeholder="Location"
                  {...register("location")}
                  error={errors.location?.message}
                />

                <Button
                  type="submit"
                  disabled={SignUpMutation.isPending}
                  className="w-full py-2.5 mt-2 bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200 rounded-xl shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  {SignUpMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </Button>

                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 pt-1">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                  Secure Registration
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
