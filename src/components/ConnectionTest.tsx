
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    console.log(message);
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    addLog('🔍 Starting connection tests...');
    
    // Test direct backend connection
    try {
      addLog('🧪 Testing direct backend connection (localhost:3001)...');
      const directResponse = await fetch('http://localhost:3001/api/health');
      if (directResponse.ok) {
        const data = await directResponse.json();
        addLog('✅ Direct backend connection: SUCCESS');
        addLog(`📊 Response: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Direct backend connection failed: ${directResponse.status}`);
      }
    } catch (error: any) {
      addLog(`❌ Direct backend connection error: ${error.message}`);
    }

    // Test proxy connection
    try {
      addLog('🧪 Testing proxy connection (/api)...');
      const proxyResponse = await fetch('/api/health');
      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        addLog('✅ Proxy connection: SUCCESS');
        addLog(`📊 Response: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Proxy connection failed: ${proxyResponse.status}`);
      }
    } catch (error: any) {
      addLog(`❌ Proxy connection error: ${error.message}`);
    }

    // Test localhost:80 proxy
    try {
      addLog('🧪 Testing localhost:80 proxy...');
      const localhostResponse = await fetch('http://localhost/api/health');
      if (localhostResponse.ok) {
        const data = await localhostResponse.json();
        addLog('✅ Localhost:80 proxy: SUCCESS');
        addLog(`📊 Response: ${JSON.stringify(data)}`);
      } else {
        addLog(`❌ Localhost:80 proxy failed: ${localhostResponse.status}`);
      }
    } catch (error: any) {
      addLog(`❌ Localhost:80 proxy error: ${error.message}`);
    }

    addLog('🏁 Connection tests completed');
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>🔧 Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Test Backend Connection'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-bold mb-2">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionTest;
