---
template_alias: welcome-7
day_offset: 18
stream: broadcast
subject_a: "The unit in your portfolio that's lying to you"
subject_b: "I ran a per-unit P&L last quarter. It changed everything."
preheader: "Aggregate looked fine. Per-unit was a different story."
---

For about 18 months, I ran my portfolio P&L the way most multi-unit operators do.

Total revenue, minus total expenses, minus financing costs. One spreadsheet. One number per quarter. Looked fine.

Then I ran it per unit.

---

Unit E (the Jūrmala studio I keep mentioning) was masking as profitable in aggregate because Units A and B were carrying it.

Once I separated everything out:

- Unit E's STR revenue: ~{{str_summer_rate_typical}} × occupancy nights for 5 months, flatlining in winter
- Unit E's costs: cleaning, utilities (especially winter — {{utility_burn_typical}}/mo when empty), supplies, listing fees, maintenance
- Unit E's net annual margin: NEGATIVE.

I was paying to own that unit. The portfolio total was fine because the other units pulled enough to absorb it.

---

The fix is structural, not analytical.

You don't need fancy software (yet — I'll come back to that). You need a spreadsheet with these columns:

- Unit name
- Monthly gross revenue (or annual divided by 12 for the ones that aren't seasonal)
- Cleaning cost per month (real, not estimated)
- Utilities per month (most operators forget this)
- Supplies + restocking per month
- Maintenance + repairs (12-month average)
- Listing/platform fees
- Financing cost allocated to that unit
- **NET MONTHLY MARGIN per unit**

Sort by net margin. The bottom row tells you which unit needs a decision.

For me that bottom row was Unit E. The decision was: flip it seasonally going forward, or sell it.

I chose flip. Flipping should clear roughly {{loss_per_unit_per_season}} per off-season vs the prior approach.

---

The spreadsheet is the cheap version. Once you're past 8-10 units, the manual update becomes a job. That's why I built Mr Props — so the per-unit P&L runs itself and surfaces the bottom row automatically.

That's the only reason it exists.

— Helvis

---
unsubscribe_footer: |
  [Unsubscribe]({{unsubscribe_url}}).
