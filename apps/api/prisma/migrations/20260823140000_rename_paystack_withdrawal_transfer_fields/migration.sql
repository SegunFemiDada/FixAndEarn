/*
  This migration is intentionally a no-op.

  The provider-neutral withdrawal transfer fields were already renamed
  by the preceding migration:

  20260816194834_cleanup_paystack_naming

  Keeping this migration as a no-op preserves the existing migration
  history without attempting to rename columns that no longer exist.
*/

SELECT 1;