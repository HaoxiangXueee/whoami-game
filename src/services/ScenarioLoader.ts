/**
 * 剧本加载服务
 * 支持JSON动态加载和缓存管理
 */

import type {
  ScenarioConfig,
  ScenarioIndex,
  ScenarioIndexItem,
  ScenarioValidationResult,
  WinLoseConditions,
} from '../types/scenario';

const SCENARIO_BASE_PATH = '/scenarios';
const INDEX_FILE = 'index.json';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ScenarioLoader {
  private indexCache: CacheEntry<ScenarioIndex> | null = null;
  private scenarioCache: Map<string, CacheEntry<ScenarioConfig>> = new Map();

  /**
   * 加载剧本索引
   */
  async loadIndex(): Promise<ScenarioIndex> {
    // 检查缓存
    if (this.indexCache && this.isCacheValid(this.indexCache)) {
      console.log('[ScenarioLoader] 使用缓存的索引');
      return this.indexCache.data;
    }

    try {
      const response = await fetch(`${SCENARIO_BASE_PATH}/${INDEX_FILE}`);
      if (!response.ok) {
        throw new Error(`Failed to load index: ${response.status} ${response.statusText}`);
      }

      const index: ScenarioIndex = await response.json();

      // 验证索引格式
      if (!this.validateIndex(index)) {
        throw new Error('Invalid index format');
      }

      // 更新缓存
      this.indexCache = {
        data: index,
        timestamp: Date.now(),
      };

      console.log(`[ScenarioLoader] 索引加载完成，共 ${index.scenarios.length} 个剧本`);
      return index;
    } catch (error) {
      console.error('[ScenarioLoader] 加载索引失败:', error);
      throw error;
    }
  }

  /**
   * 加载单个剧本
   */
  async loadScenario(id: string): Promise<ScenarioConfig> {
    // 检查缓存
    const cached = this.scenarioCache.get(id);
    if (cached && this.isCacheValid(cached)) {
      console.log(`[ScenarioLoader] 使用缓存的剧本: ${id}`);
      return cached.data;
    }

    try {
      const response = await fetch(`${SCENARIO_BASE_PATH}/${id}.json`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Scenario not found: ${id}`);
        }
        throw new Error(`Failed to load scenario: ${response.status} ${response.statusText}`);
      }

      const rawScenario = await response.json();

      // 转换数据格式（兼容 winLoseConditions 和分开的 winConditions/loseConditions）
      const scenario = this.normalizeScenarioFormat(rawScenario);

      // 验证剧本格式
      const validation = this.validateScenario(scenario);
      if (!validation.valid) {
        console.warn(`[ScenarioLoader] 剧本 ${id} 验证警告:`, validation.warnings);
      }

      // 更新缓存
      this.scenarioCache.set(id, {
        data: scenario,
        timestamp: Date.now(),
      });

      console.log(`[ScenarioLoader] 剧本加载完成: ${scenario.name}`);
      return scenario;
    } catch (error) {
      console.error(`[ScenarioLoader] 加载剧本 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 批量预加载剧本
   */
  async preloadScenarios(ids: string[]): Promise<void> {
    console.log(`[ScenarioLoader] 开始预加载 ${ids.length} 个剧本`);
    const promises = ids.map(id =>
      this.loadScenario(id).catch(error => {
        console.warn(`[ScenarioLoader] 预加载 ${id} 失败:`, error.message);
      })
    );
    await Promise.all(promises);
    console.log('[ScenarioLoader] 预加载完成');
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.indexCache = null;
    this.scenarioCache.clear();
    console.log('[ScenarioLoader] 缓存已清除');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { indexCached: boolean; scenariosCached: number } {
    return {
      indexCached: this.indexCache !== null,
      scenariosCached: this.scenarioCache.size,
    };
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  /**
   * 验证索引格式
   */
  private validateIndex(index: any): index is ScenarioIndex {
    return (
      typeof index === 'object' &&
      index !== null &&
      typeof index.version === 'string' &&
      typeof index.lastUpdated === 'string' &&
      Array.isArray(index.scenarios) &&
      index.scenarios.every((s: any) =>
        typeof s.id === 'string' &&
        typeof s.name === 'string'
      )
    );
  }

  /**
   * 标准化剧本格式
   * 确保返回的剧本同时有 winConditions/loseConditions 和 winLoseConditions
   */
  private normalizeScenarioFormat(raw: any): ScenarioConfig {
    const scenario: ScenarioConfig = { ...raw };

    // 处理胜利/失败条件
    if (scenario.winLoseConditions) {
      // JSON 格式：有 winLoseConditions，展开为分开的字段
      const conditions = scenario.winLoseConditions as WinLoseConditions;
      scenario.winConditions = conditions.winConditions;
      scenario.loseConditions = conditions.loseConditions;
    } else if (scenario.winConditions && scenario.loseConditions) {
      // TypeScript 格式：有分开的字段，组合为 winLoseConditions
      scenario.winLoseConditions = {
        winConditions: scenario.winConditions,
        loseConditions: scenario.loseConditions,
      };
    } else {
      // 都没有，设置默认空数组
      scenario.winConditions = [];
      scenario.loseConditions = [];
      scenario.winLoseConditions = {
        winConditions: [],
        loseConditions: [],
      };
    }

    return scenario;
  }

  /**
   * 验证剧本格式
   */
  private validateScenario(scenario: any): ScenarioValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 必填字段检查
    if (!scenario.id) errors.push('缺少 id');
    if (!scenario.name) errors.push('缺少 name');
    if (!scenario.emperor?.name) errors.push('缺少 emperor.name');
    if (!scenario.background) warnings.push('缺少 background');
    if (!scenario.playerIntro) warnings.push('缺少 playerIntro');

    // NPC检查
    if (!scenario.npcs || scenario.npcs.length === 0) {
      warnings.push('没有配置NPC');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// 导出单例实例
export const scenarioLoader = new ScenarioLoader();

// 导出类型
export type { CacheEntry };
