// Mock user service - implement with your actual DB
export async function getUserByApiKey(apiKey: string) {
  // TODO: Implement with database
  if (apiKey.startsWith('sk_live_') || apiKey.startsWith('sk_test_')) {
    return {
      id: 'user_' + apiKey.substr(-8),
      apiKey: apiKey
    };
  }
  return null;
}

export async function getUserById(userId: string) {
  // TODO: Implement with database
  return {
    id: userId,
    credits: 50
  };
}
