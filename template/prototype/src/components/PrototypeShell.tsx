import React, {
  FunctionComponent,
  Suspense,
  lazy,
  useMemo,
  ComponentType,
  Component,
  ReactNode,
} from 'react';
import { useParams } from 'react-router-dom';
import { Flex, FlexItem, Message, Text } from '@bigcommerce/big-design';
import { Header, Page } from '@bigcommerce/big-design-patterns';
import { theme } from '@bigcommerce/big-design-theme';
import { AnnotationOverlay } from './AnnotationOverlay';

interface PrototypeModule {
  default: ComponentType;
}

const prototypeCache = new Map<string, React.LazyExoticComponent<ComponentType>>();

function getPrototypeComponent(name: string): React.LazyExoticComponent<ComponentType> {
  const existing = prototypeCache.get(name);
  if (existing) return existing;

  const LazyComponent = lazy<ComponentType>(
    () =>
      import(`../../prototypes/${name}/routes.tsx`) as Promise<PrototypeModule>,
  );
  prototypeCache.set(name, LazyComponent);
  return LazyComponent;
}

const ErrorFallback: FunctionComponent<{ name: string }> = ({ name }) => (
  <Page
    header={
      <Header
        title="Prototype Not Found"
        description={`Could not load prototype "${name}"`}
      />
    }
  >
    <Flex flexDirection="column" flexGap={theme.spacing.medium}>
      <FlexItem>
        <Message
          type="error"
          messages={[
            {
              text: `The prototype "${name}" could not be loaded. It may not have been generated yet, or the route module may be missing.`,
            },
          ]}
        />
      </FlexItem>
    </Flex>
  </Page>
);

const LoadingFallback: FunctionComponent = () => (
  <Page header={<Header title="Loading Prototype..." description="" />}>
    <Flex flexDirection="column" flexGap={theme.spacing.medium}>
      <FlexItem>
        <Text>Loading prototype module...</Text>
      </FlexItem>
    </Flex>
  </Page>
);

const ANNOTATIONS_ENABLED_KEY = 'bds-annotations-enabled';

function isAnnotationsEnabled(): boolean {
  try {
    return localStorage.getItem(ANNOTATIONS_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export const PrototypeShell: FunctionComponent = () => {
  const { '*': splat } = useParams();
  const name = splat?.split('/')[0] ?? 'unknown';

  const LazyPrototype = useMemo(() => getPrototypeComponent(name), [name]);
  const showAnnotations = isAnnotationsEnabled();

  return (
    <ErrorBoundary fallback={<ErrorFallback name={name} />}>
      <Suspense fallback={<LoadingFallback />}>
        <LazyPrototype />
      </Suspense>
      {showAnnotations && <AnnotationOverlay />}
    </ErrorBoundary>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.fallback}
          <pre style={{ margin: 24, padding: 16, background: '#fee', color: '#900', fontSize: 12, overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </>
      );
    }
    return this.props.children;
  }
}
