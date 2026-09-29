/**
 * The single source of truth for MarksKhata's plans. Defined once here so the
 * landing page, the in-app upgrade screen and the billing/webhook code (once
 * built) all read the same numbers — see docs/PRODUCT_PRD.md § "Plans,
 * limits & auto-pay" for the reasoning behind each figure.
 */
export type Plan = {
  id: "free" | "starter" | "basic" | "standard" | "school";
  name: string;
  maxStudents: number;
  teacherLogins: number;
  whatsappIncluded: number;
  monthlyPriceInPaise: number;
  yearlyPriceInPaise: number;
};

export const PLANS: Plan[] = [
  { id: "free", name: "Free", maxStudents: 50, teacherLogins: 1, whatsappIncluded: 0, monthlyPriceInPaise: 0, yearlyPriceInPaise: 0 },
  { id: "starter", name: "Starter", maxStudents: 150, teacherLogins: 2, whatsappIncluded: 50, monthlyPriceInPaise: 14_900, yearlyPriceInPaise: 149_900 },
  { id: "basic", name: "Basic", maxStudents: 300, teacherLogins: 3, whatsappIncluded: 100, monthlyPriceInPaise: 34_900, yearlyPriceInPaise: 349_900 },
  { id: "standard", name: "Standard", maxStudents: 750, teacherLogins: 5, whatsappIncluded: 250, monthlyPriceInPaise: 69_900, yearlyPriceInPaise: 699_900 },
  { id: "school", name: "School", maxStudents: 2000, teacherLogins: 15, whatsappIncluded: 500, monthlyPriceInPaise: 149_900, yearlyPriceInPaise: 1_499_900 },
];

export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return rupees === 0
    ? "₹0"
    : `₹${rupees.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Per-student cost at a plan's own student limit — what the landing page
 * calls "when your plan is full". Below that limit the true cost per student
 * is higher, which is why the page also offers a calculator for the
 * visitor's real number instead of only quoting this figure. */
export function perStudentAtCapacity(plan: Plan, billing: "monthly" | "yearly"): number | null {
  if (plan.maxStudents === 0) return null;
  const price = billing === "monthly" ? plan.monthlyPriceInPaise : plan.yearlyPriceInPaise / 12;
  return price / plan.maxStudents;
}
