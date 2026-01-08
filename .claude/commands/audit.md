Your goal is to update any vulnerable dependencies.

Do the following:

1. Run `npm audit` to find vulnerable installed packages in this project.
2. Check the severity and number of vulnerabilities before proceeding.
3. Run `npm audit fix` to apply updates (this applies non-breaking updates).
4. If breaking changes are needed, run `npm audit fix --force` with caution (review changes carefully).
5. Run tests to verify the updates didn't break anything.
6. If tests fail after updates, review the changes and either:
   - Fix compatibility issues in the code
   - Revert problematic updates and investigate alternatives
   - Consider updating to a compatible version manually