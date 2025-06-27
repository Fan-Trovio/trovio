import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Types based on your database schema
export interface User {
  id?: number
  wallet_address: string
  credits?: number
  last_active?: string
  created_at?: string
  twitter?: string
  evm_wallet_address?: string
}

export interface Vault {
  id?: number
  name: string
  total_prize?: number
  available_prize?: number
  vault_sponsor?: string
  sponsor_links?: Record<string, any>
  ai_prompt?: string
  created_at?: string
  freecreditawarded?: Record<string, any>
  tweetContent?: string
  discord_link?: string
  linkedin_link?: string
  whitepaper_link?: string
  retweet_content?: string
  extra_link?: string
  vault_public_key?: string
  blockchain?: string
  required_token_address?: string
  required_token_type?: string
  required_amount?: number
  required_token_id?: string
}

export interface VaultCondition {
  id?: string
  vault_id?: string
  condition_type?: string
  token_address?: string
  token_type?: string
  amount?: number
  reward_credits?: number
  created_at?: string
}

export interface Conversation {
  id?: number
  user_id?: number
  vault_id?: number
  created_at?: string
}

export interface Transaction {
  id?: number
  user_id?: number
  vault_id?: number
  amount: number
  transaction_type: string
  timestamp?: string
}

export interface Message {
  id?: number
  conversation_id?: number
  content: string
  role: string
  timestamp?: string
}

// Database class to handle all operations
class Database {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // ============== USER OPERATIONS ==============
  
  async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }
    
    return data
  }

  async createUser(user: User): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return null
    }

    return data
  }

  async updateUser(walletAddress: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data
  }

  async updateUserCredits(walletAddress: string, credits: number): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .update({ credits, last_active: new Date().toISOString() })
      .eq('wallet_address', walletAddress)
      .select()
      .single()

    if (error) {
      console.error('Error updating user credits:', error)
      return null
    }

    return data
  }

  // ============== VAULT OPERATIONS ==============

  async getAllVaults(): Promise<Vault[]> {
    const { data, error } = await this.supabase
      .from('vaults')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vaults:', error)
      return []
    }

    return data || []
  }

  async getVaultById(id: number): Promise<Vault | null> {
    const { data, error } = await this.supabase
      .from('vaults')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching vault:', error)
      return null
    }

    return data
  }

  async createVault(vault: Vault): Promise<Vault | null> {
    const { data, error } = await this.supabase
      .from('vaults')
      .insert([vault])
      .select()
      .single()

    if (error) {
      console.error('Error creating vault:', error)
      return null
    }

    return data
  }

  async updateVault(id: number, updates: Partial<Vault>): Promise<Vault | null> {
    const { data, error } = await this.supabase
      .from('vaults')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating vault:', error)
      return null
    }

    return data
  }

  async getVaultsByBlockchain(blockchain: string): Promise<Vault[]> {
    const { data, error } = await this.supabase
      .from('vaults')
      .select('*')
      .eq('blockchain', blockchain)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching vaults by blockchain:', error)
      return []
    }

    return data || []
  }

  // ============== VAULT CONDITIONS OPERATIONS ==============

  async getVaultConditions(vaultId: string): Promise<VaultCondition[]> {
    const { data, error } = await this.supabase
      .from('vault_conditions')
      .select('*')
      .eq('vault_id', vaultId)

    if (error) {
      console.error('Error fetching vault conditions:', error)
      return []
    }

    return data || []
  }

  async createVaultCondition(condition: VaultCondition): Promise<VaultCondition | null> {
    const { data, error } = await this.supabase
      .from('vault_conditions')
      .insert([condition])
      .select()
      .single()

    if (error) {
      console.error('Error creating vault condition:', error)
      return null
    }

    return data
  }

  // ============== CONVERSATION OPERATIONS ==============

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  }

  async getConversationsByVault(vaultId: number): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('vault_id', vaultId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations by vault:', error)
      return []
    }

    return data || []
  }

  async createConversation(conversation: Conversation): Promise<Conversation | null> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert([conversation])
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data
  }

  // ============== TRANSACTION OPERATIONS ==============

  async getTransactionsByUser(userId: number): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching transactions:', error)
      return []
    }

    return data || []
  }

  async getTransactionsByVault(vaultId: number): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('vault_id', vaultId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching transactions by vault:', error)
      return []
    }

    return data || []
  }

  async getTransactionsByWalletAddress(walletAddress: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select(`
        *,
        users!inner(wallet_address)
      `)
      .eq('users.wallet_address', walletAddress)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching transactions by wallet:', error)
      return []
    }

    return data || []
  }

  async createTransaction(transaction: Transaction): Promise<Transaction | null> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single()

    if (error) {
      console.error('Error creating transaction:', error)
      return null
    }

    return data
  }

  // ============== MESSAGE OPERATIONS ==============

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  }

  async createMessage(message: Message): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert([message])
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return null
    }

    return data
  }

  // ============== COMPLEX QUERIES ==============

  async getUserWithTransactions(walletAddress: string) {
    const user = await this.getUserByWalletAddress(walletAddress)
    if (!user) return null

    const transactions = await this.getTransactionsByUser(user.id!)
    
    return {
      ...user,
      transactions
    }
  }

  async getVaultWithConditions(vaultId: number) {
    const vault = await this.getVaultById(vaultId)
    if (!vault) return null

    const conditions = await this.getVaultConditions(vaultId.toString())
    
    return {
      ...vault,
      conditions
    }
  }

  async getConversationWithMessages(conversationId: number) {
    const { data: conversation, error: convError } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (convError) {
      console.error('Error fetching conversation:', convError)
      return null
    }

    const messages = await this.getMessagesByConversation(conversationId)
    
    return {
      ...conversation,
      messages
    }
  }

  // ============== UTILITY FUNCTIONS ==============

  async createOrUpdateUser(walletAddress: string, updates: Partial<User> = {}): Promise<User | null> {
    const existingUser = await this.getUserByWalletAddress(walletAddress)
    
    if (existingUser) {
      return await this.updateUser(walletAddress, {
        ...updates,
        last_active: new Date().toISOString()
      })
    } else {
      return await this.createUser({
        wallet_address: walletAddress,
        credits: 0,
        ...updates
      })
    }
  }

  // Get the Supabase client directly for custom queries
  getSupabaseClient(): SupabaseClient {
    return this.supabase
  }
}

// Export a singleton instance
export const db = new Database()

// Export the Database class for testing or multiple instances
export { Database } 