/**
 * Subscription System - Управление тарифами и доступом к функциям
 * 
 * Архитектура:
 * - subscriptions: аккаунт привязан к тарифу (free/professional/business)
 * - features: список всех функций системы
 * - subscription_features: матрица доступа (какие функции в каких тарифах)
 * 
 * Использование:
 * ```typescript
 * const hasAccess = await hasFeatureAccess(accountId, 'chat_search')
 * if (!hasAccess) {
 *   // показать upgrade предложение
 * }
 * ```
 */

import { query } from './db'

export type PlanName = 'free' | 'professional' | 'business'
export type FeatureName = 
  | 'chat_search'              // Поиск по сообщениям
  | 'advanced_filters'         // Расширенные фильтры
  | 'api_access'               // API доступ
  | 'custom_fields'            // Пользовательские поля
  | 'bulk_operations'          // Массовые операции
  | 'advanced_analytics'       // Продвинутая аналитика
  | 'automation'               // Автоматизация
  | 'email_integration'        // Email интеграция
  | 'priority_support'         // Приоритетная поддержка
  | 'white_label'              // White-label

/**
 * Проверяет доступ аккаунта к функции
 * @param accountId - ID аккаунта
 * @param featureName - Название функции
 * @returns true если есть доступ, false если нет
 */
export async function hasFeatureAccess(
  accountId: string,
  featureName: FeatureName
): Promise<boolean> {
  try {
    const result = await query(`
      SELECT EXISTS(
        SELECT 1 
        FROM subscriptions s
        JOIN subscription_features sf ON s.plan_name = sf.plan_name
        WHERE s.account_id = $1
          AND s.status = 'active'
          AND (s.expires_at IS NULL OR s.expires_at > NOW())
          AND sf.feature_name = $2
      ) as has_access
    `, [accountId, featureName])

    return result.rows[0]?.has_access === true
  } catch (error) {
    console.error('Error checking feature access:', error)
    return false // по умолчанию запрещаем доступ при ошибке
  }
}

/**
 * Получает текущий тариф аккаунта
 * @param accountId - ID аккаунта
 * @returns Название тарифа или null
 */
export async function getAccountPlan(accountId: string): Promise<PlanName | null> {
  try {
    const result = await query(`
      SELECT plan_name
      FROM subscriptions
      WHERE account_id = $1
        AND status = 'active'
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `, [accountId])

    return (result.rows[0]?.plan_name as PlanName) || null
  } catch (error) {
    console.error('Error getting account plan:', error)
    return null
  }
}

/**
 * Получает список доступных функций для аккаунта
 * @param accountId - ID аккаунта
 * @returns Массив названий доступных функций
 */
export async function getAccountFeatures(accountId: string): Promise<FeatureName[]> {
  try {
    const result = await query(`
      SELECT DISTINCT sf.feature_name
      FROM subscriptions s
      JOIN subscription_features sf ON s.plan_name = sf.plan_name
      WHERE s.account_id = $1
        AND s.status = 'active'
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    `, [accountId])

    return result.rows.map((row: any) => row.feature_name as FeatureName)
  } catch (error) {
    console.error('Error getting account features:', error)
    return []
  }
}

/**
 * Информация о тарифном плане
 */
export interface PlanInfo {
  name: PlanName
  displayName: string
  price: number
  currency: string
  features: FeatureName[]
  isPopular?: boolean
}

/**
 * Возвращает информацию о всех доступных тарифах
 */
export function getAllPlans(): PlanInfo[] {
  return [
    {
      name: 'free',
      displayName: 'Free',
      price: 0,
      currency: 'RUB',
      features: [],
    },
    {
      name: 'professional',
      displayName: 'Professional',
      price: 1990,
      currency: 'RUB',
      features: [
        'chat_search',
        'advanced_filters',
        'api_access',
        'custom_fields',
        'advanced_analytics',
      ],
      isPopular: true,
    },
    {
      name: 'business',
      displayName: 'Business',
      price: 4990,
      currency: 'RUB',
      features: [
        'chat_search',
        'advanced_filters',
        'api_access',
        'custom_fields',
        'advanced_analytics',
        'bulk_operations',
        'automation',
        'email_integration',
        'priority_support',
        'white_label',
      ],
    },
  ]
}

/**
 * Человекочитаемые названия функций
 */
export const FEATURE_NAMES: Record<FeatureName, string> = {
  chat_search: 'Поиск по сообщениям',
  advanced_filters: 'Расширенные фильтры',
  api_access: 'API доступ',
  custom_fields: 'Пользовательские поля',
  bulk_operations: 'Массовые операции',
  advanced_analytics: 'Продвинутая аналитика',
  automation: 'Автоматизация',
  email_integration: 'Email интеграция',
  priority_support: 'Приоритетная поддержка',
  white_label: 'White-label',
}
