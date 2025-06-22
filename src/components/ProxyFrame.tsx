
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

interface ProxyFrameProps {
  url: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fullScreen?: boolean;
}

const ProxyFrame: React.FC<ProxyFrameProps> = ({ 
  url, 
  title, 
  description, 
  icon: Icon, 
  fullScreen = false
}) => {
  if (fullScreen) {
    return (
      <div className="w-full h-screen">
        <div className="flex items-center space-x-2 mb-4 px-4">
          <Icon className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">{title}</h2>
          <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>
        <div className="w-full h-full">
          <iframe 
            src={url}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-navigation"
            allow="fullscreen"
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
          <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height: '600px' }} className="border rounded-lg overflow-hidden">
          <iframe 
            src={url}
            className="w-full h-full border-0"
            title={title}
            sandbox="allow-same-origin allow-scripts allow-forms allow-navigation"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProxyFrame;
