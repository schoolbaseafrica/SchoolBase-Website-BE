## Contributing to Open School Portal

Thank you for your interest in contributing to **Open School Portal**!
We welcome all contributions — bug reports, feature proposals, documentation updates, and code improvements.
Your participation helps make the platform smarter, more reliable, and more impactful for schools.

## Getting Started

### 1. Fork the repository from GitHub.

```sh
git clone https://github.com/<your-username>/open-school-portal.git
```

### 2. Navigate into the project directory:

```sh
cd open-school-portal
```

### 3. Environment Setup

```sh
cp .env.example .env
```

### 4. Install dependencies:

```sh
npm ci
```

### 5. Start the development server:

```sh
npm run start:dev
```

> You can now preview and interact with the application locally.

## How to Contribute

### Reporting Bugs

If you discover a bug:

- Open an issue on the repository’s [GitHub Issues](https://github.com/hngprojects/open-school-portal-BE/issues) page.
- Provide detailed steps to reproduce the bug.
- Include expected vs. actual behavior.
- Attach logs, screenshots, or error messages when possible.
- Clear bug reports help us resolve issues faster.

### Suggesting Features

Have an idea that would improve Open School Portal?

- Create a feature request on [GitHub Issues](https://github.com/hngprojects/open-school-portal-BE/issues).
- Describe the feature clearly and explain its value.
- Share how you imagine it should behave or integrate with existing features.
- Thoughtful feature suggestions help drive meaningful improvements.

### Code Contributions

Before writing any code:

- Ensure you have forked the repository.
- All your work should happen inside your fork, not the main repo.

  > We follow a structured workflow to keep contributions organized and easy to review.

## Development Workflow

1. **Create a new branch for your work:**

   ```sh
   git checkout -b feat/HNG-2145-your-feature-name
   ```

2. Make your changes.

3. **Commit your updates** using the required commit message format:

   ```sh
   git commit -m "feat: your commit message"
   ```

4. Push your branch to your fork:

   ```sh
   git push origin <your-branch>
   ```

## Coding Standards & PR Requirements

To maintain a clean, scalable, and predictable codebase across all developers, the following standards are mandatory for every contribution:

---

#### 1. Use HttpStatus (NestJS) — No Hardcoded Status Codes

❌ Avoid:

```ts
return {
  status_code: 200,
  message: 'Account Created Successfully',
  data: { id: 'uuid' },
};
```

✅ Use:

```ts
import { HttpStatus } from '@nestjs/common';

return {
  status_code: HttpStatus.CREATED,
  message: SYS_MSG.ACCOUNT_CREATED,
  data: { id: 'uuid' },
};
```

#### 2. Use System Message Codes (No Free-Text Messages)

❌ Avoid:

```ts
message: 'Account created successfully';
```

✅ Use:

```ts
message: SYS_MSG.ACCOUNT_CREATED;
```

#### 3. No `any` allowed in the codebase

Before any PR is merged, the codebase must contain zero any types:

- Not in `DTOs`
- Not in `services`
- Not in `controllers`
- Not in `helpers` or `utilities`

**Use proper typing instead:**

```ts
async findUserById(id: string): Promise<User> {
  // implementation
}
```

#### 4. Strongly Typed Controller/Service Method Signatures

Example for an authentication flow:

```ts
async register(
  registerDto: RegisterDto,
): Promise<BaseResponse<RegisterResponse>> {
  // implementation
}
```

#### 5. Testing Proof Is Required in Every PR

Every PR must include at least one of the following:

- Screenshot of Swagger UI showing the tested endpoint
- OR Postman screenshot showing request + response

   > PRs without test evidence **will not be reviewed or merged.**

## Branch Naming Rules

Branches should follow this structure:

```sh
<type>/<ticket-or-issue-number>-short-description
```

### Valid types:

- `feat/` — new features
- `fix/` — bug fixes
- `refactor/` — code restructuring without changing behavior
- `chore/` — maintenance tasks (dependencies, configs, CI, etc.)
- `docs/` — documentation updates

### Rules:

- Include the ticket or issue number when one exists (e.g., HNG-2145).
- Use a short, clear lowercase description.

  #### Example with ticket:

  ```bash
  feat/HNG-1234-create-login-page
  ```

  #### Example without ticket (rare):

  ```sh
  chore/remove-unused-variables
  ```

## Commit Message Rules

Commit messages follow this pattern:

```sh
type: message
```

#### Examples:

- `feat: create login form`
- `fix: correct pagination logic`
- `refactor(HNG-1234): simplify user input validation`

#### Rules to follow:

- Use imperative tense — “add,” “fix,” “update,” **NOT** “added” or “I fixed.”
- The ticket number is optional in commit messages since it already appears in the branch name.
- Keep messages short, clear, and descriptive.

## Submitting Pull Requests

1. Make sure your branch is updated with the latest changes from upstream:

   ```sh
   git checkout main
   git pull origin main
   git checkout <your-branch>
   git rebase main
   ```

2. Run tests:

   ```sh
   npm test
   ```

   > Always ensure tests pass before submitting a PR.

3. Submit a pull request from your branch to the upstream main branch.

4. In the PR description:
   - Explain what you changed.
   - **Provide context**: link the issue or ticket.
   - Include any additional notes for the reviewers.

## Code of Conduct

Open School Portal follows the **Contributor Covenant Code of Conduct**.
All contributors are expected to uphold respectful, inclusive, and professional interactions.
