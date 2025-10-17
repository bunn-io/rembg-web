# Contributing to @bunnio/rembg-web

Thank you for your interest in contributing to rembg-web! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/rembg-web.git
   cd rembg-web
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/bunn-io/rembg-web.git
   ```

## Development Setup

### Prerequisites

- Node.js 22+
- Yarn package manager
- Git

### Installation

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Download models** (required for testing):

   ```bash
   yarn fetch-models
   ```

3. **Build the project**:
   ```bash
   yarn build
   ```

### Available Scripts

- `yarn dev` - Watch mode for development
- `yarn build` - Build the library
- `yarn test` - Run all tests
- `yarn test:unit` - Run unit tests
- `yarn test:e2e` - Run end-to-end tests
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier
- `yarn docs:build` - Generate API documentation
- `yarn fetch-models` - Download ONNX models

## Making Changes

### Branch Naming

Use descriptive branch names:

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Use meaningful variable and function names
- Keep functions small and focused

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:

- `feat(sessions): add support for custom model paths`
- `fix(image): handle edge case in image processing`
- `docs(readme): update installation instructions`

## Testing

### Unit Tests

- Write unit tests for new functionality
- Use Vitest for testing framework
- Place tests in `tests/unit/` directory
- Follow naming convention: `*.test.ts`

### End-to-End Tests

- Add E2E tests for user-facing features
- Use Playwright for browser testing
- Place tests in `tests/e2e/` directory
- Test in multiple browsers

### Running Tests

```bash
# Run all tests
yarn test

# Run unit tests only
yarn test:unit

# Run E2E tests only
yarn test:e2e

# Run tests in watch mode
yarn test:unit --watch

# Run tests with coverage
yarn test:unit:coverage
```

### Test Requirements

- All tests must pass
- Maintain or improve test coverage
- Test edge cases and error conditions
- Include performance tests for critical paths

## Submitting Changes

### Before Submitting

1. **Update tests** - Add tests for new functionality
2. **Update documentation** - Update README, API docs, or examples
3. **Run linting** - `yarn lint` and `yarn format`
4. **Run tests** - Ensure all tests pass
5. **Update CHANGELOG.md** - Add entry for your changes

### Pull Request Process

1. **Create a pull request** from your fork
2. **Fill out the PR template** completely
3. **Link related issues** using keywords like "Fixes #123"
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Requirements

- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] No breaking changes (or clearly documented)
- [ ] Performance impact is considered

## Issue Guidelines

### Before Creating an Issue

1. **Search existing issues** to avoid duplicates
2. **Check documentation** and examples
3. **Try the latest version** of the library
4. **Test with different browsers** if applicable

### Bug Reports

Use the bug report template and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node.js version)
- Error messages and console output
- Sample code or images if relevant

### Feature Requests

Use the feature request template and include:

- Clear description of the feature
- Use cases and motivation
- Implementation ideas if you have them
- Impact on existing functionality

## Pull Request Guidelines

### Review Process

1. **Automated checks** must pass (CI, linting, tests)
2. **Code review** by maintainers
3. **Testing** in multiple environments
4. **Documentation review** if applicable

### Merge Requirements

- [ ] All CI checks pass
- [ ] At least one maintainer approval
- [ ] No merge conflicts
- [ ] Up-to-date with main branch

### After Merge

- Delete the feature branch
- Update any related issues
- Celebrate your contribution! 🎉

## Development Tips

### Debugging

- Use browser dev tools for client-side debugging
- Add console.log statements for debugging (remove before PR)
- Use `yarn test:unit:ui` for interactive test debugging

### Performance

- Profile performance-critical code
- Consider bundle size impact
- Test with large images
- Monitor memory usage

### Browser Compatibility

- Test in multiple browsers
- Check WebAssembly support
- Verify WebGL/WebGPU functionality
- Test on mobile devices

## Getting Help

- **GitHub Discussions** - For questions and general discussion
- **GitHub Issues** - For bug reports and feature requests
- **Documentation** - Check the docs site and examples

## Recognition

Contributors will be recognized in:

- CHANGELOG.md for significant contributions
- README.md for major contributors
- GitHub's contributor graph

Thank you for contributing to rembg-web! 🚀
