# Contributing to CineScope 🎬

First off, thanks for taking the time to contribute! ❤️

The following is a set of guidelines for contributing to CineScope. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 🤔 How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check [existing issues](https://github.com/teddexter0/cineScope/issues) as you might find out that you don't need to create one.

**When you are creating a bug report, please include as many details as possible:**

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, browser, Node.js version)

### Suggesting Enhancements ✨

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and explain the behavior you expected**
- **Explain why this enhancement would be useful**

### Your First Code Contribution 🚀

Unsure where to begin contributing? You can start by looking through these issues:

- `good-first-issue` - issues that should only require a few lines of code
- `help-wanted` - issues that should be a bit more involved than beginner issues

### Pull Requests 📝

Please follow these steps to have your contribution considered:

1. **Fork the repo and create your branch from `main`**
2. **If you've added code that should be tested, add tests**
3. **Ensure the test suite passes**
4. **Make sure your code lints**
5. **Write a compelling pull request description**

## 🎨 Style Guidelines

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

**Examples:**
```
feat: add smart notification system
fix: resolve database connection timeout
docs: update README with new API endpoints
style: format code with prettier
refactor: simplify user authentication flow
test: add unit tests for movie recommendation engine
```

### TypeScript/JavaScript Style

- Use TypeScript for all new code
- Follow existing code style (we use Prettier)
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Prefer `const` over `let` when possible

### Code Organization

```
// ✅ Good
const getUserMoviePreferences = async (userId: string): Promise<UserPreferences> => {
  // Clear, descriptive function name
  // Proper TypeScript types
  // Single responsibility
}

// ❌ Bad  
const getStuff = (id) => {
  // Vague function name
  // No types
  // Unclear purpose
}
```

## 🏗️ Development Process

### Setting Up Development Environment

1. **Fork and clone the repo**
   ```bash
   git clone https://github.com/teddexter0/cineScope.git
   cd cinescope
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys
   ```

4. **Set up database**
   ```bash
   npx prisma db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

### Testing

- Run tests with `npm test`
- Add tests for new features
- Ensure all tests pass before submitting PR

### Code Quality

- Run linting with `npm run lint`
- Format code with `npm run format`
- Type check with `npm run type-check`

## 📁 Project Structure

```
cinescope/
├── app/                 # Next.js App Router pages
├── lib/                 # Utility functions and services
├── components/          # Reusable React components
├── prisma/             # Database schema and migrations
├── public/             # Static assets
└── types/              # TypeScript type definitions
```

## 🔧 Areas for Contribution

### High Priority
- 🤖 **AI/ML improvements** - Better recommendation algorithms
- 📱 **Mobile responsiveness** - Better mobile experience
- ⚡ **Performance optimization** - Faster load times
- 🔐 **Security enhancements** - Better authentication/authorization

### Medium Priority  
- 🎨 **UI/UX improvements** - Better design and user experience
- 📊 **Analytics dashboard** - User engagement metrics
- 🌍 **Internationalization** - Multi-language support
- 🔗 **API integrations** - More movie data sources

### Low Priority
- 📝 **Documentation** - Better guides and examples
- 🧪 **Test coverage** - More comprehensive testing
- 🔧 **DevOps** - CI/CD improvements
- 🐛 **Bug fixes** - Small issues and edge cases

## 💬 Questions?

Feel free to contact the project maintainers:
- Open an issue with your question
- Email: [teddexter0@gmail.com]

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity
- Gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Examples of behavior that contributes to creating a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special shoutouts for major features

Thanks for contributing! 🙌