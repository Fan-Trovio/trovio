// Usage examples for the database utility
// This file shows how to use the database functions in your application

import { db, User, Vault, Transaction } from './database'

// ============== USER EXAMPLES ==============

// Example: Get or create a user when they connect their wallet
export async function handleUserConnection(walletAddress: string) {
  // Try to get existing user
  let user = await db.getUserByWalletAddress(walletAddress)
  
  if (!user) {
    // Create new user if doesn't exist
    user = await db.createOrUpdateUser(walletAddress, {
      credits: 100, // Give new users 100 starting credits
    })
    console.log('New user created:', user)
  } else {
    // Update last active time for existing user
    user = await db.updateUser(walletAddress, {
      last_active: new Date().toISOString()
    })
    console.log('Existing user updated:', user)
  }
  
  return user
}

// Example: Update user credits after an action
export async function awardCredits(walletAddress: string, creditsToAdd: number) {
  const user = await db.getUserByWalletAddress(walletAddress)
  if (!user) {
    throw new Error('User not found')
  }
  
  const newCredits = (user.credits || 0) + creditsToAdd
  const updatedUser = await db.updateUserCredits(walletAddress, newCredits)
  
  return updatedUser
}

// ============== VAULT EXAMPLES ==============

// Example: Create a new vault
export async function createNewVault(vaultData: {
  name: string
  totalPrize: number
  sponsor: string
  aiPrompt: string
  blockchain?: string
}) {
  const vault = await db.createVault({
    name: vaultData.name,
    total_prize: vaultData.totalPrize,
    available_prize: vaultData.totalPrize, // Initially all prize is available
    vault_sponsor: vaultData.sponsor,
    ai_prompt: vaultData.aiPrompt,
    blockchain: vaultData.blockchain || 'aptos'
  })
  
  console.log('New vault created:', vault)
  return vault
}

// Example: Get all vaults for a specific blockchain
export async function getBlockchainVaults(blockchain: string) {
  const vaults = await db.getVaultsByBlockchain(blockchain)
  console.log(`Found ${vaults.length} vaults for ${blockchain}`)
  return vaults
}

// ============== TRANSACTION EXAMPLES ==============

// Example: Record a transaction when user participates in a vault
export async function recordVaultParticipation(
  walletAddress: string, 
  vaultId: number, 
  amount: number
) {
  // Get user ID
  const user = await db.getUserByWalletAddress(walletAddress)
  if (!user) {
    throw new Error('User not found')
  }
  
  // Create transaction record
  const transaction = await db.createTransaction({
    user_id: user.id!,
    vault_id: vaultId,
    amount: amount,
    transaction_type: 'vault_participation'
  })
  
  console.log('Transaction recorded:', transaction)
  return transaction
}

// Example: Get user's transaction history
export async function getUserTransactionHistory(walletAddress: string) {
  const transactions = await db.getTransactionsByWalletAddress(walletAddress)
  console.log(`Found ${transactions.length} transactions for wallet ${walletAddress}`)
  return transactions
}

// ============== CONVERSATION EXAMPLES ==============

// Example: Start a new conversation between user and vault
export async function startConversation(walletAddress: string, vaultId: number) {
  // Get user
  const user = await db.getUserByWalletAddress(walletAddress)
  if (!user) {
    throw new Error('User not found')
  }
  
  // Create conversation
  const conversation = await db.createConversation({
    user_id: user.id!,
    vault_id: vaultId
  })
  
  console.log('New conversation started:', conversation)
  return conversation
}

// Example: Add a message to a conversation
export async function addMessageToConversation(
  conversationId: number, 
  content: string, 
  role: string
) {
  const message = await db.createMessage({
    conversation_id: conversationId,
    content: content,
    role: role // 'user' or 'assistant'
  })
  
  console.log('Message added:', message)
  return message
}

// ============== COMPLEX QUERIES EXAMPLES ==============

// Example: Get complete user profile with transaction history
export async function getUserProfile(walletAddress: string) {
  const userWithTransactions = await db.getUserWithTransactions(walletAddress)
  
  if (!userWithTransactions) {
    return null
  }
  
  // Calculate total spending
  const totalSpent = userWithTransactions.transactions
    .filter(t => t.transaction_type === 'vault_participation')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  
  return {
    ...userWithTransactions,
    totalSpent,
    transactionCount: userWithTransactions.transactions.length
  }
}

// Example: Get vault with all its conditions and participants
export async function getVaultDetails(vaultId: number) {
  const vaultWithConditions = await db.getVaultWithConditions(vaultId)
  
  if (!vaultWithConditions) {
    return null
  }
  
  // Get all transactions for this vault to find participants
  const transactions = await db.getTransactionsByVault(vaultId)
  const participantIds = [...new Set(transactions.map(t => t.user_id))]
  
  return {
    ...vaultWithConditions,
    participantCount: participantIds.length,
    totalParticipation: transactions.reduce((sum, t) => sum + Number(t.amount), 0)
  }
}

// ============== UTILITY FUNCTIONS ==============

// Example: Check if user has enough credits for an action
export async function checkUserCredits(walletAddress: string, requiredCredits: number) {
  const user = await db.getUserByWalletAddress(walletAddress)
  
  if (!user) {
    return { hasEnough: false, currentCredits: 0, required: requiredCredits }
  }
  
  const currentCredits = user.credits || 0
  
  return {
    hasEnough: currentCredits >= requiredCredits,
    currentCredits,
    required: requiredCredits,
    shortage: Math.max(0, requiredCredits - currentCredits)
  }
}

// Example: Get dashboard data for a user
export async function getUserDashboard(walletAddress: string) {
  const user = await db.getUserByWalletAddress(walletAddress)
  if (!user) return null
  
  const [transactions, conversations] = await Promise.all([
    db.getTransactionsByUser(user.id!),
    db.getConversationsByUser(user.id!)
  ])
  
  return {
    user,
    stats: {
      totalTransactions: transactions.length,
      totalConversations: conversations.length,
      totalSpent: transactions.reduce((sum, t) => sum + Number(t.amount), 0),
      lastActive: user.last_active
    },
    recentTransactions: transactions.slice(0, 5),
    recentConversations: conversations.slice(0, 5)
  }
} 