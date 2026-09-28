<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inspectionsApi, type InspectionDto } from '@/api/inspections.api'
import { blocksApi, type BlockDto } from '@/api/blocks.api'
import { getScoreSeverity } from '@/utils/score'
import ScoreBar from '@/components/ScoreBar.vue'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()

interface BlockStat {
  block: BlockDto
  avgScore: number | null
  rounds: InspectionDto[]
}

const blocks = ref<BlockDto[]>([])
const inspections = ref<InspectionDto[]>([])
const loading = ref(true)
const error = ref(false)

// Индекс текущего обхода в карусели, по id блока
const activeIndex = reactive<Record<number, number>>({})

function inspectionAvg(i: InspectionDto): number | null {
  const vals = [i.shower, i.toilet, i.hall, i.kitchen, i.roomA, i.roomB].filter(
    (v): v is number => v != null,
  )
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

const blockStats = computed<BlockStat[]>(() => {
  const byBlock = new Map<number, InspectionDto[]>()
  for (const i of inspections.value) {
    if (!byBlock.has(i.blockId)) byBlock.set(i.blockId, [])
    byBlock.get(i.blockId)!.push(i)
  }

  return blocks.value.map((block) => {
    const blockInspections = (byBlock.get(block.id) ?? [])
      .slice()
      .sort((a, b) => {
        const byDate = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (byDate !== 0) return byDate
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    const rounds = blockInspections.slice(0, 3)
    const roundAvgs = rounds.map(inspectionAvg).filter((v): v is number => v != null)

    const avgScore = roundAvgs.length
      ? +(roundAvgs.reduce((a, b) => a + b, 0) / roundAvgs.length).toFixed(1)
      : null

    return { block, avgScore, rounds }
  })
})

const floors = computed(() => {
  const byFloor = new Map<number, BlockStat[]>()
  for (const stat of blockStats.value) {
    const floor = stat.block.floor
    if (!byFloor.has(floor)) byFloor.set(floor, [])
    byFloor.get(floor)!.push(stat)
  }

  return Array.from(byFloor.entries())
    .sort(([a], [b]) => a - b)
    .map(([floor, stats]) => ({
      floor,
      stats: stats.slice().sort((a, b) => {
        if (a.avgScore == null && b.avgScore == null) return a.block.number - b.block.number
        if (a.avgScore == null) return 1
        if (b.avgScore == null) return -1
        return a.avgScore - b.avgScore
      }),
    }))
})

function currentIndex(stat: BlockStat): number {
  return activeIndex[stat.block.id] ?? 0
}

function currentRound(stat: BlockStat): InspectionDto | undefined {
  return stat.rounds[currentIndex(stat)]
}

function prevRound(stat: BlockStat) {
  const cur = currentIndex(stat)
  if (cur > 0) activeIndex[stat.block.id] = cur - 1
}

function nextRound(stat: BlockStat) {
  const cur = currentIndex(stat)
  if (cur < stat.rounds.length - 1) activeIndex[stat.block.id] = cur + 1
}

function goToBlockInspections(stat: BlockStat) {
  router.push({
    name: 'admin-inspections',
    query: { blockId: stat.block.id, blockNumber: stat.block.number },
  })
}

onMounted(async () => {
  try {
    const [blocksData, inspectionsData] = await Promise.all([
      blocksApi.getAll(),
      inspectionsApi.getAll(),
    ])
    blocks.value = blocksData
    inspections.value = inspectionsData
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="page-title">Статистика</h1>

    <div v-if="loading" class="flex justify-content-center mt-6">
      <ProgressSpinner />
    </div>

    <Message v-else-if="error" severity="error">Не удалось загрузить данные</Message>

    <Message v-else-if="!blocks.length" severity="info">Блоки ещё не добавлены</Message>

    <template v-else>
      <div v-for="group in floors" :key="group.floor" class="floor-section">
        <h2 class="floor-title">Этаж {{ group.floor }}</h2>
        <div class="blocks-grid">
          <div v-for="stat in group.stats" :key="stat.block.id" class="block-card">
            <div class="block-card__header" @click="goToBlockInspections(stat)">
              <span class="block-card__number">Блок №{{ stat.block.number }}</span>
              <Tag
                :value="stat.avgScore !== null ? String(stat.avgScore) : '—'"
                :severity="getScoreSeverity(stat.avgScore)"
              />
            </div>

            <div v-if="!stat.rounds.length" class="block-card__empty">Нет данных</div>

            <div v-else class="round-carousel">
              <div class="round-carousel__nav">
                <Button
                  icon="pi pi-chevron-left"
                  text
                  rounded
                  size="small"
                  :disabled="currentIndex(stat) === 0"
                  @click="prevRound(stat)"
                />
                <div class="round-carousel__date">
                  {{ new Date(currentRound(stat)!.date).toLocaleDateString('ru-RU') }}
                  <span class="round-carousel__pos">{{ currentIndex(stat) + 1 }}/{{ stat.rounds.length }}</span>
                </div>
                <Button
                  icon="pi pi-chevron-right"
                  text
                  rounded
                  size="small"
                  :disabled="currentIndex(stat) === stat.rounds.length - 1"
                  @click="nextRound(stat)"
                />
              </div>

              <div class="scores-col">
                <ScoreBar :value="currentRound(stat)!.shower" label="Душ" />
                <ScoreBar :value="currentRound(stat)!.toilet" label="Туалет" />
                <ScoreBar :value="currentRound(stat)!.hall" label="Коридор" />
                <ScoreBar :value="currentRound(stat)!.kitchen" label="Кухня" />
                <ScoreBar :value="currentRound(stat)!.roomA" label="Комн. А" />
                <ScoreBar :value="currentRound(stat)!.roomB" label="Комн. Б" />
              </div>

              <div v-if="currentRound(stat)!.comment" class="comment-badge">
                <i class="pi pi-exclamation-circle" />
                {{ currentRound(stat)!.comment }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.floor-section {
  margin-bottom: 2rem;
}

.floor-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.blocks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  align-items: start;
}

.block-card {
  background: var(--p-surface-0);
  border-radius: 10px;
  padding: 1.1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.block-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.block-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  cursor: pointer;
}

.block-card__number {
  font-weight: 700;
  font-size: 1.05rem;
}

.block-card__empty {
  font-size: 0.8rem;
  color: var(--p-text-muted-color);
}

.round-carousel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.round-carousel__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.round-carousel__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--p-text-color);
  line-height: 1.2;
}

.round-carousel__pos {
  font-size: 0.7rem;
  font-weight: 400;
  color: var(--p-text-muted-color);
}

.scores-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-badge {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: var(--p-orange-50);
  border: 1px solid var(--p-orange-200);
  border-left: 4px solid var(--p-orange-400);
  color: var(--p-orange-800);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.4;
}

.comment-badge .pi {
  color: var(--p-orange-500);
  flex-shrink: 0;
  margin-top: 2px;
}
</style>
