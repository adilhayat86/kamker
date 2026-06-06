import { redirect } from "next/navigation";

export const metadata = {
  title: "Professionals | Kamker",
  description: "Browse individual and company-managed workers on Kamker.",
};

export default function CompanyListingsRedirectPage() {
  redirect("/professionals");
}
