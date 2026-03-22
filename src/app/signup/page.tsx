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

const SignUpSchema = z.object({
  name: z.string().min(2, "Fullname is required"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  greenhouseName: z.string().min(1, "Greenhouse name is required"),
  location: z.string().min(1, "Location is required"),
});

type SignUpForm = z.infer<typeof SignUpSchema>;

export default function SignInPage() {
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
        alert(error.message);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl h-137.5 bg-white rounded-3xl shadow-xl overflow-hidden grid grid-cols-2">
        <div
          className="relative hidden md:flex flex-col justify-between p-10 text-white"
          style={{
            backgroundImage: "url(/auth/greenhouse.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-br from-green-950/80 via-green-900/70 to-green-700/60"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold tracking-wide">Greenhouse</h1>
          </div>
          {/* backdrop-blur-sm bg-white/10 p-6 rounded-xl */}
          <div className="relative z-10 space-y-2 ">
            <h2 className="text-3xl font-semibold">Smart Farming</h2>
            <p className="text-green-100 text-sm max-w-xs leading-relaxed">
              Manage your greenhouse efficiently with a modern dashboard built
              for farmers and agriculture businesses
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-10">
          <motion.div
            initial={{opacity: 0, y: 15}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.4}}
            className="w-full max-w-sm"
          >
            <div className="space-y-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-semibold text-gray-400">
                  Create an account
                </h1>
                <p className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    href={"/signin"}
                    className="text-green-600 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmmit)} className="space-y-4">
                <Input
                  placeholder="Full Name"
                  {...register("name")}
                  error={errors.name?.message}
                />
                <Input
                  type="email"
                  placeholder="Email"
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
                  className="w-full py-2 bg-green-600 hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {SignUpMutation.isPending
                    ? "Creating account..."
                    : "Create account"}
                </Button>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <div className="flex-1 h-px bg-gray-200" />
                  Secure registration
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
