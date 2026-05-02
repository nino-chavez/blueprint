import {
  FunctionComponent,
  useState,
  useCallback,
  useEffect,
  useRef,
  MouseEvent as ReactMouseEvent,
} from 'react';
import { Box, Button, Flex, FlexItem, Panel, Text, Textarea } from '@bigcommerce/big-design';
import { theme } from '@bigcommerce/big-design-theme';
import { useLocation } from 'react-router-dom';

const STORAGE_PREFIX = 'bds-annotations:';

function loadAnnotations(key: string): Annotation[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? (JSON.parse(raw) as Annotation[]) : [];
  } catch {
    return [];
  }
}

function saveAnnotations(key: string, annotations: Annotation[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(annotations));
  } catch {
    // localStorage full or unavailable
  }
}

export interface Annotation {
  elementPath: string;
  position: { x: number; y: number };
  text: string;
  timestamp: string;
}

interface AnnotationOverlayProps {
  initialAnnotations?: Annotation[];
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

function buildElementPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current !== document.documentElement) {
    const tag = current.tagName.toLowerCase();
    const id = current.id ? `#${current.id}` : '';
    const className =
      current.className && typeof current.className === 'string'
        ? `.${current.className.trim().split(/\s+/).join('.')}`
        : '';
    parts.unshift(`${tag}${id}${className}`);
    current = current.parentElement;
  }
  return parts.join(' > ');
}

export const AnnotationOverlay: FunctionComponent<AnnotationOverlayProps> = ({
  initialAnnotations = [],
  onAnnotationsChange,
}) => {
  const { pathname } = useLocation();
  const storageKey = pathname;

  const [isActive, setIsActive] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>(
    () => loadAnnotations(storageKey).length > 0
      ? loadAnnotations(storageKey)
      : initialAnnotations,
  );
  const [pendingPosition, setPendingPosition] = useState<{
    x: number;
    y: number;
    elementPath: string;
  } | null>(null);
  const [noteText, setNoteText] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveAnnotations(storageKey, annotations);
    onAnnotationsChange?.(annotations);
  }, [annotations, onAnnotationsChange, storageKey]);

  const handleToggle = useCallback(() => {
    setIsActive((prev) => !prev);
    setPendingPosition(null);
    setNoteText('');
  }, []);

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!isActive) return;
      const target = event.target as Element;
      if (overlayRef.current?.contains(target)) return;

      const rect = document.documentElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setPendingPosition({
        x,
        y,
        elementPath: buildElementPath(target),
      });
      setNoteText('');
    },
    [isActive],
  );

  const handleSaveNote = useCallback(() => {
    if (!pendingPosition || !noteText.trim()) return;

    const newAnnotation: Annotation = {
      elementPath: pendingPosition.elementPath,
      position: { x: pendingPosition.x, y: pendingPosition.y },
      text: noteText.trim(),
      timestamp: new Date().toISOString(),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);
    setPendingPosition(null);
    setNoteText('');
  }, [pendingPosition, noteText]);

  const handleCancelNote = useCallback(() => {
    setPendingPosition(null);
    setNoteText('');
  }, []);

  const handleNoteChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      setNoteText(event.target.value);
    },
    [],
  );

  const [showList, setShowList] = useState(false);

  const handleToggleList = useCallback(() => {
    setShowList((prev) => !prev);
  }, []);

  const handleDeleteAnnotation = useCallback((index: number) => {
    setAnnotations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const PIN_SIZE = 28;

  return (
    <>
      <Flex
        style={{
          position: 'fixed',
          bottom: theme.spacing.xLarge,
          right: theme.spacing.xLarge,
          zIndex: 1000,
        }}
        flexGap={theme.spacing.small}
      >
        {annotations.length > 0 && (
          <Button
            variant="secondary"
            onClick={handleToggleList}
          >
            {showList ? 'Hide' : 'View'} ({annotations.length})
          </Button>
        )}
        <Button
          variant={isActive ? 'primary' : 'secondary'}
          onClick={handleToggle}
        >
          {isActive ? 'Exit Annotations' : 'Annotate'}
        </Button>
      </Flex>

      {isActive && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            cursor: 'crosshair',
          }}
          onClick={handleOverlayClick}
        />
      )}

      {annotations.map((annotation, index) => (
        <Box
          key={`${annotation.timestamp}-${index}`}
          style={{
            position: 'absolute',
            left: annotation.position.x,
            top: annotation.position.y,
            zIndex: 999,
            transform: 'translate(-50%, -100%)',
            width: PIN_SIZE,
            height: PIN_SIZE,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          backgroundColor="primary"
          borderRadius="circle"
        >
          <Text color="white" bold>
            {index + 1}
          </Text>
        </Box>
      ))}

      {showList && annotations.length > 0 && (
        <Box
          style={{
            position: 'fixed',
            top: theme.spacing.xLarge,
            right: theme.spacing.xLarge,
            bottom: '80px',
            width: '340px',
            zIndex: 1002,
            overflowY: 'auto',
          }}
        >
          <Panel header={`Annotations (${annotations.length})`}>
            <Flex flexDirection="column" flexGap={theme.spacing.medium}>
              {annotations.map((annotation, index) => (
                <FlexItem key={`${annotation.timestamp}-${index}`}>
                  <Flex flexGap={theme.spacing.small} alignItems="flex-start">
                    <Box
                      style={{
                        width: PIN_SIZE,
                        height: PIN_SIZE,
                        minWidth: PIN_SIZE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      backgroundColor="primary"
                      borderRadius="circle"
                    >
                      <Text color="white" bold>
                        {index + 1}
                      </Text>
                    </Box>
                    <FlexItem flexGrow={1}>
                      <Text>{annotation.text}</Text>
                      <Text color="secondary60">
                        {new Date(annotation.timestamp).toLocaleTimeString()}
                      </Text>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="subtle"
                        onClick={() => handleDeleteAnnotation(index)}
                      >
                        Remove
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              ))}
            </Flex>
          </Panel>
        </Box>
      )}

      {pendingPosition && (
        <Box
          ref={overlayRef}
          style={{
            position: 'absolute',
            left: pendingPosition.x,
            top: pendingPosition.y,
            zIndex: 1001,
            minWidth: '250px',
          }}
          backgroundColor="white"
          border="box"
          borderRadius="normal"
          padding="medium"
        >
          <Flex flexDirection="column" flexGap={theme.spacing.small}>
            <FlexItem>
              <Textarea
                label="Annotation Note"
                rows={3}
                value={noteText}
                onChange={handleNoteChange}
                placeholder="Enter your annotation..."
              />
            </FlexItem>
            <FlexItem>
              <Flex flexGap={theme.spacing.small}>
                <FlexItem>
                  <Button variant="primary" onClick={handleSaveNote}>
                    Save
                  </Button>
                </FlexItem>
                <FlexItem>
                  <Button variant="subtle" onClick={handleCancelNote}>
                    Cancel
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </Box>
      )}
    </>
  );
};
