"use client";

import { useState } from "react";
import { PLANS, formatRupees, perStudentAtCapacity } from "@/lib/plans";

/**
 * The pricing section from docs/PRODUCT_PRD.md § "The price, in rupees per
 * student": a monthly/yearly toggle, one card per plan, and a calculator so a
 * visitor sees their own real per-student cost rather than only the
 * best-case "when your plan is full" figure — the PRD is explicit that
 * quoting only the best case would read as misleading once a smaller school
 * does the maths themselves.
 */
export function PricingTable() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [studentCount, setStudentCount] = useState<number | "">("");

  const paidPlans = PLANS.filter((plan) => plan.id !== "free");
  const freePlan = PLANS[0];

  const matchingPlan =
    typeof studentCount === "number" && studentCount > 0
      ? PLANS.find((plan) => studentCount <= plan.maxStudents) ?? PLANS[PLANS.length - 1]
      : null;
  const realPerStudent =
    matchingPlan && typeof studentCount === "number" && studentCount > 0
      ? (billing === "monthly" ? matchingPlan.monthlyPriceInPaise : matchingPlan.yearlyPriceInPaise / 12) /
        studentCount
      : null;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-center gap-3">
        <span className={billing === "monthly" ? "font-semibold" : "text-[var(--muted)]"}>Monthly</span>
        <button
          type="button"
          onClick={() => setBilling(billing === "monthly" ? "yearly" : "monthly")}
          aria-pressed={billing === "yearly"}
          className="relative h-7 w-14 rounded-full bg-[var(--brand)] transition-colors"
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
              billing === "yearly" ? "translate-x-8" : "translate-x-1"
            }`}
          />
        </button>
        <span className={billing === "yearly" ? "font-semibold" : "text-[var(--muted)]"}>
          Yearly <span className="text-[var(--brand)]">(2 months free)</span>
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <PlanCard
          name={freePlan.name}
          maxStudents={freePlan.maxStudents}
          price="₹0"
          period=""
          highlight="Most schools start here"
        />
        {paidPlans.map((plan) => {
          const price = billing === "monthly" ? plan.monthlyPriceInPaise : plan.yearlyPriceInPaise;
          const perStudent = perStudentAtCapacity(plan, billing);
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              maxStudents={plan.maxStudents}
              price={formatRupees(price)}
              period={billing === "monthly" ? "/month" : "/year"}
              subtext={
                perStudent != null
                  ? `About ${formatRupees(perStudent)} per student, when full`
                  : undefined
              }
            />
          );
        })}
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-black/10 bg-white p-6 text-center">
        <label htmlFor="student-count" className="block text-sm font-medium text-[var(--muted)]">
          How many students do you have?
        </label>
        <input
          id="student-count"
          type="number"
          min={1}
          inputMode="numeric"
          value={studentCount}
          onChange={(event) => setStudentCount(event.target.value === "" ? "" : Number(event.target.value))}
          placeholder="e.g. 200"
          className="mt-2 w-full rounded-lg border border-black/15 px-4 py-2 text-center text-lg"
        />
        {matchingPlan && realPerStudent != null && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            {matchingPlan.id === "free" ? (
              <>That fits the <b>Free</b> plan — ₹0.</>
            ) : (
              <>
                That fits <b>{matchingPlan.name}</b>: {formatRupees(billing === "monthly" ? matchingPlan.monthlyPriceInPaise : matchingPlan.yearlyPriceInPaise)}
                {billing === "monthly" ? "/month" : "/year"} — about{" "}
                <b>{formatRupees(realPerStudent)} per student per month</b>.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  maxStudents,
  price,
  period,
  subtext,
  highlight,
}: {
  name: string;
  maxStudents: number;
  price: string;
  period: string;
  subtext?: string;
  highlight?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-5 ${
        highlight ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-black/10 bg-white"
      }`}
    >
      {highlight && (
        <span className="mb-2 self-start rounded-full bg-[var(--brand)] px-2.5 py-0.5 text-xs font-medium text-white">
          {highlight}
        </span>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">Up to {maxStudents.toLocaleString("en-IN")} students</p>
      <p className="mt-4 text-2xl font-bold">
        {price}
        <span className="text-sm font-normal text-[var(--muted)]">{period}</span>
      </p>
      {subtext && <p className="mt-1 text-xs text-[var(--muted)]">{subtext}</p>}
      <a
        href="/signup"
        className="mt-5 rounded-lg border border-[var(--brand)] px-4 py-2 text-center text-sm font-medium text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white"
      >
        Start free
      </a>
    </div>
  );
}
