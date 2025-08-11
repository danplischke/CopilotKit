# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.10.0-next.10] - 2024-01-XX

### Added
- Initial release of `@copilotkit/runtime-client-agui`
- Direct connection to ag_ui servers without GraphQL proxy
- Support for multiple agents with individual server URLs
- `AguiRuntimeClient` class for direct ag_ui communication
- `useAguiRuntimeClient` React hook for easy integration
- Message conversion utilities between CopilotKit and ag_ui formats
- Dynamic agent management (add/remove agents at runtime)
- Comprehensive error handling and error transformation
- TypeScript support with full type definitions
- Jest test suite with comprehensive test coverage
- Example usage and documentation

### Features
- **Direct ag_ui Connection**: Bypass the traditional GraphQL proxy layer
- **Multi-Agent Support**: Configure multiple agents with different server URLs
- **Agent Management**: Add and remove agents dynamically
- **Error Handling**: Comprehensive error handling with CopilotKit error types
- **Message Conversion**: Utilities for converting between message formats
- **React Integration**: Seamless integration with existing CopilotKit React hooks
- **TypeScript**: Full TypeScript support with comprehensive type definitions

### Technical Details
- Built with TypeScript and tsup for optimal bundle size
- Uses RxJS for reactive programming patterns
- Integrates with existing CopilotKit error handling system
- Supports streaming responses from ag_ui servers
- Handles authentication and custom headers per agent
- Compatible with existing CopilotKit React components and hooks

