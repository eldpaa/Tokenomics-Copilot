import { AnimatedListDemo } from "@/components/ui/demo";

export default function Demo() {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-160px)] px-4 py-8">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-4 text-center text-white tracking-tight">
          Animated List Component Preview
        </h1>
        <p className="text-sm text-center text-white/60 mb-6">
          Magic UI AnimatedList with automatic spring physics and live feed staggering.
        </p>
        <AnimatedListDemo />
      </div>
    </div>
  );
}
