
import React from 'react';
import { Button } from '@/components/ui/button';

interface FormattedChatResponseProps {
  content: string;
  onSendMessage: (content: string) => Promise<void>;
}

const FormattedChatResponse = ({ content, onSendMessage }: FormattedChatResponseProps) => {
  // Parse the structured response
  const parseStructuredResponse = (text: string) => {
    const sections: { [key: string]: string } = {};
    let currentSection = '';
    let currentContent = '';
    
    const lines = text.split('\n');
    
    for (const line of lines) {
      // Check for main headers (Status, Result, Suggested Next Actions, executed tool)
      if (line.startsWith('Status:') || line.startsWith('Results:') || line.startsWith('Result:')) {
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = line.includes('Status:') ? 'status' : 'results';
        currentContent = line;
      } else if (line.startsWith('executed tool:') || line.startsWith('Executed Tools:')) {
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = 'executedTool';
        currentContent = line;
      } else if (line.startsWith('Suggested Next Actions:')) {
        if (currentSection) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = 'suggestedActions';
        currentContent = line;
      } else {
        currentContent += '\n' + line;
      }
    }
    
    // Add the last section
    if (currentSection) {
      sections[currentSection] = currentContent.trim();
    }
    
    return sections;
  };

  // Extract suggested actions from text
  const extractSuggestedActions = (text: string): string[] => {
    const lines = text.split('\n');
    const actions: string[] = [];
    
    for (const line of lines) {
      // Look for lines that start with bullet points and contain quoted text
      const match = line.match(/[•·*-]\s*"([^"]+)"/);
      if (match) {
        actions.push(match[1]);
      }
    }
    
    return actions;
  };

  const handleActionClick = async (action: string) => {
    await onSendMessage(action);
  };

  // Check if this looks like a structured response
  const isStructuredResponse = content.includes('Status:') || content.includes('Results:') || content.includes('Result:');
  
  if (!isStructuredResponse) {
    // Return regular text for non-structured responses
    return (
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-foreground whitespace-pre-wrap">{content}</p>
      </div>
    );
  }

  const sections = parseStructuredResponse(content);

  return (
    <div className="space-y-4">
      {/* Status Section */}
      {sections.status && (
        <div>
          <div className="text-foreground">
            {sections.status.split('\n').map((line, index) => {
              if (line.startsWith('Status:')) {
                return (
                  <div key={index}>
                    <span className="font-bold">Status:</span>
                    <span className="ml-1">{line.replace('Status:', '')}</span>
                  </div>
                );
              }
              return <div key={index} className="whitespace-pre-wrap">{line}</div>;
            })}
          </div>
        </div>
      )}

      {/* Results Section */}
      {sections.results && (
        <div>
          <div className="text-foreground">
            {sections.results.split('\n').map((line, index) => {
              if (line.startsWith('Results:') || line.startsWith('Result:')) {
                return (
                  <div key={index} className="font-bold mb-2">
                    {line}
                  </div>
                );
              }
              return <div key={index} className="whitespace-pre-wrap">{line}</div>;
            })}
          </div>
        </div>
      )}

      {/* Executed Tool Section - Gray text */}
      {sections.executedTool && (
        <div className="text-muted-foreground text-sm">
          <div className="whitespace-pre-wrap">{sections.executedTool}</div>
        </div>
      )}

      {/* Suggested Next Actions Section */}
      {sections.suggestedActions && (
        <div>
          <div className="font-bold text-foreground mb-3">Suggested Next Actions:</div>
          <div className="space-y-2">
            {extractSuggestedActions(sections.suggestedActions).map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start h-auto p-3 text-left whitespace-normal break-words"
                onClick={() => handleActionClick(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormattedChatResponse;
