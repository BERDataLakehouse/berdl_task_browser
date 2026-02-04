import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface IErrorBoundaryProps {
  children: ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  IErrorBoundaryProps,
  IErrorBoundaryState
> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): IErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[CTS] React error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="error" sx={{ fontSize: '0.75rem', mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography
            sx={{ fontSize: '0.65rem', color: 'text.secondary', mb: 1 }}
          >
            {this.state.error?.message}
          </Typography>
          <Button
            size="small"
            onClick={this.handleRetry}
            sx={{ fontSize: '0.65rem' }}
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
