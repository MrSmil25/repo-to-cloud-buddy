GRANT SELECT ON public.financial_wallets TO authenticated;
GRANT SELECT ON public.monthly_cashflow TO authenticated;
GRANT SELECT ON public.cashflow_projection TO authenticated;
GRANT SELECT ON public.financial_wallets TO service_role;
GRANT SELECT ON public.monthly_cashflow TO service_role;
GRANT SELECT ON public.cashflow_projection TO service_role;
GRANT EXECUTE ON FUNCTION public.financial_period_summary(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.financial_category_breakdown(date, date, text) TO authenticated;