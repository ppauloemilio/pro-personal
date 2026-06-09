import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  href?: string;
  className?: string;
  nameClassName?: string;
};

const sizes = {
  sm: { box: "h-9 w-9", image: 36, name: "text-sm" },
  md: { box: "h-10 w-10", image: 40, name: "text-xl" },
  lg: { box: "h-12 w-12", image: 48, name: "text-xl" },
};

export function AppLogo({
  size = "sm",
  showName = true,
  href,
  className,
  nameClassName = "text-white",
}: AppLogoProps) {
  const s = sizes[size];

  const content = (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl",
          s.box
        )}
      >
        <Image
          src="/logo.png"
          alt="Pro-Personal"
          width={s.image}
          height={s.image}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      {showName && (
        <span className={cn("font-display font-bold", nameClassName, s.name)}>
          Pro-Personal
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition opacity-100 hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
