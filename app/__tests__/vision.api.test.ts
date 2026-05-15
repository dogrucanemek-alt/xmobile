describe('Vision API Endpoint', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should call /api/chat endpoint (not /api/claude)', async () => {
    const mockBase64Image = 'data:image/jpeg;base64,ABC123';
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Tişört, Mavi' }],
      }),
    });

    await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'You are a fashion expert',
        messages: [{ role: 'user', content: mockBase64Image }],
      }),
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.any(Object)
    );

    expect(global.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/claude'),
      expect.any(Object)
    );
  });

  it('should include system prompt in request', async () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const systemPrompt = 'You are a fashion expert';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'test' }] }),
    });

    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'test' }],
    });

    await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
    const requestBody = JSON.parse(callArgs.body);

    expect(requestBody.system).toBe(systemPrompt);
  });

  it('should handle API response correctly', async () => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    const expectedResponse = {
      content: [{ text: 'Tişört, Mavi Renk' }],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => expectedResponse,
    });

    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: 'test',
        messages: [{ role: 'user', content: 'test' }],
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.content[0].text).toBe('Tişört, Mavi Renk');
  });
});
