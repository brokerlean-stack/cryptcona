import Link from "next/link";
export default function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="cc-brand">
      <span>
        cryptcona<small>TRADING STUDIO</small>
      </span>
    </Link>
  );
}
