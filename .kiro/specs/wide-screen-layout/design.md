# Design Document

## Overview

Текущий дашборд использует фиксированный `max-width: 1200px` для основного контейнера, что приводит к неэффективному использованию пространства на широких мониторах (2K, 4K). Дизайн предполагает адаптацию CSS layout с использованием responsive breakpoints и CSS Grid для максимального использования доступного пространства, сохраняя при этом все существующие компоненты и их внутренний дизайн без изменений.

**Ключевой принцип:** Изменяем только layout (расположение компонентов), не трогая их внутреннюю структуру и стили.

## Architecture

### Current Layout Structure

```
<body>
  <header>
    <div style="max-width: 1200px">  ← Ограничение ширины
      <h1>Telegram Dashboard</h1>
      <nav>...</nav>
    </div>
  </header>
  
  <main style="max-width: 1200px">  ← Ограничение ширины
    <ForumTopics />
    
    <div class="metrics-grid">  ← 3 колонки на всех экранах
      <MetricCard />
      <MetricCard />
      <MetricCard />
    </div>
    
    <div class="content-grid">  ← 2 колонки на desktop
      <TopUsers />
      <AiInsights />
    </div>
    
    <MultiStyleSummaryGenerator />  ← 2 колонки внутри
  </main>
</body>
```

### Proposed Layout Structure

```
<body>
  <header>
    <div class="header-container">  ← Адаптивная ширина
      <h1>Telegram Dashboard</h1>
      <nav>...</nav>
    </div>
  </header>
  
  <main class="main-container">  ← Адаптивная ширина
    <ForumTopics />
    
    <div class="metrics-grid">  ← Адаптивная сетка
      <MetricCard />  ← До 6 колонок на 4K
      <MetricCard />
      <MetricCard />
    </div>
    
    <div class="content-grid">  ← Адаптивная сетка
      <TopUsers />  ← До 3 колонок на 4K
      <AiInsights />
    </div>
    
    <MultiStyleSummaryGenerator />  ← До 3 колонок на 4K
  </main>
</body>
```

## Components and Interfaces

### CSS Breakpoints Strategy

Определяем 5 уровней breakpoints для адаптивного дизайна:

```css
/* Mobile: < 768px */
- 1 колонка для всего контента
- Полная ширина экрана с padding

/* Tablet: 768px - 1279px */
- 2 колонки для метрик
- 1-2 колонки для контента
- max-width: 1200px (текущее поведение)

/* Desktop: 1280px - 1919px */
- 3 колонки для метрик
- 2 колонки для контента
- max-width: 1400px

/* Wide Desktop (2K): 1920px - 2559px */
- 4-5 колонок для метрик
- 2-3 колонки для контента
- max-width: 85%

/* Ultra Wide (4K): ≥ 2560px */
- 5-6 колонок для метрик
- 3 колонки для контента
- max-width: 80%
```

### Layout Container Classes

Создаем новые CSS классы для адаптивных контейнеров:

```css
/* Адаптивный контейнер для header */
.header-container {
  max-width: 1200px;  /* Mobile/Tablet */
  margin: 0 auto;
  padding: 0 1rem;
}

@media (min-width: 1280px) {
  .header-container {
    max-width: 1400px;
  }
}

@media (min-width: 1920px) {
  .header-container {
    max-width: 85%;
  }
}

@media (min-width: 2560px) {
  .header-container {
    max-width: 80%;
  }
}

/* Адаптивный контейнер для main */
.main-container {
  max-width: 1200px;  /* Mobile/Tablet */
  margin: 0 auto;
  padding: 2rem 1rem;
}

@media (min-width: 1280px) {
  .main-container {
    max-width: 1400px;
  }
}

@media (min-width: 1920px) {
  .main-container {
    max-width: 85%;
  }
}

@media (min-width: 2560px) {
  .main-container {
    max-width: 80%;
  }
}
```

### Metrics Grid Adaptation

Адаптируем `.metrics-grid` для разных разрешений:

```css
.metrics-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
  
  /* Mobile: 1 колонка */
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  /* Tablet: 2 колонки */
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  /* Desktop: 3 колонки (текущее поведение) */
  .metrics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1920px) {
  /* Wide Desktop: 4-5 колонок */
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
}

@media (min-width: 2560px) {
  /* Ultra Wide: 5-6 колонок */
  .metrics-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }
}
```

### Content Grid Adaptation

Адаптируем `.content-grid` для размещения TopUsers и AiInsights:

```css
.content-grid {
  display: grid;
  gap: 2rem;
  margin-bottom: 2rem;
  
  /* Mobile: 1 колонка */
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  /* Tablet и выше: 2 колонки (текущее поведение) */
  .content-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1920px) {
  /* Wide Desktop: 2-3 колонки */
  .content-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  }
}

@media (min-width: 2560px) {
  /* Ultra Wide: 3 колонки */
  .content-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Multi-Style Summary Generator Adaptation

Компонент `MultiStyleSummaryGenerator` уже использует адаптивную сетку:

```css
/* Текущий код в компоненте */
gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))'
```

Оптимизируем для широких экранов:

```css
/* Новая адаптивная сетка */
.persona-grid {
  display: grid;
  gap: 1.5rem;
  
  /* Mobile: 1 колонка */
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  /* Tablet: 1 колонка (карточки широкие) */
  .persona-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 1280px) {
  /* Desktop: 2 колонки */
  .persona-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1920px) {
  /* Wide Desktop: 2-3 колонки */
  .persona-grid {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  }
}

@media (min-width: 2560px) {
  /* Ultra Wide: 3 колонки */
  .persona-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## Data Models

Изменения в data models не требуются. Все компоненты продолжают получать те же props:

```typescript
// Без изменений
type MetricCardProps = {
  label: string;
  value: number;
  accent?: string;
};

type TopUsersProps = {
  topUsers: TopUser[];
};

type AiInsightsProps = {
  report?: ReportPayload | null;
};

type MultiStyleSummaryGeneratorProps = {
  chatId?: string;
  threadId?: string;
  date: string;
};
```

## Implementation Details

### File Changes Required

#### 1. `app/globals.css` - Основные изменения

**Изменения:**
- Удалить фиксированный `max-width: 1200px` из `main`
- Добавить адаптивные классы `.header-container` и `.main-container`
- Обновить `.metrics-grid` с responsive breakpoints
- Обновить `.content-grid` с responsive breakpoints
- Добавить новый класс `.persona-grid` для MultiStyleSummaryGenerator

**Сохраняем без изменений:**
- Все стили компонентов (`.metric-card`, `.content-section`, `.user-list`, `button`, `.error`, `.loading`)
- Стили для ForumTopics (`.forum-topics`, `.topics-list`, `.topic-button`)
- Цвета, шрифты, отступы внутри компонентов

#### 2. `app/layout.tsx` - Обновление header

**Изменения:**
```tsx
// Было:
<header>
  <div>
    <h1>Telegram Dashboard</h1>
    <nav>...</nav>
  </div>
</header>

// Станет:
<header>
  <div className="header-container">
    <h1>Telegram Dashboard</h1>
    <nav>...</nav>
  </div>
</header>
```

#### 3. `app/page.tsx` и `app/week/page.tsx` - Обновление main

**Изменения:**
```tsx
// Было:
<div>
  <ForumTopics ... />
  <div className="metrics-grid">...</div>
  <div className="content-grid">...</div>
  <MultiStyleSummaryGenerator ... />
</div>

// Станет:
<div className="main-container">
  <ForumTopics ... />
  <div className="metrics-grid">...</div>
  <div className="content-grid">...</div>
  <MultiStyleSummaryGenerator ... />
</div>
```

**Примечание:** Обертка `<div>` уже существует, просто добавляем класс.

#### 4. `components/multi-style-summary-generator.tsx` - Обновление сетки

**Изменения:**
```tsx
// Было:
<div style={{ 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
  gap: '1.5rem' 
}}>

// Станет:
<div className="persona-grid">
```

**Сохраняем без изменений:**
- Все остальные стили компонента
- Логику генерации отчетов
- Кнопки и их поведение
- Цвета персон

## Error Handling

### Responsive Layout Issues

**Проблема:** На некоторых разрешениях контент может выглядеть слишком растянутым или сжатым.

**Решение:**
- Использовать `minmax()` в CSS Grid для контроля минимальной/максимальной ширины колонок
- Тестировать на разных разрешениях: 1920x1080, 2560x1440, 3840x2160
- Добавить `max-width` для текстовых блоков внутри компонентов (если нужно)

### Text Readability

**Проблема:** На очень широких экранах текст может стать слишком растянутым и трудночитаемым.

**Решение:**
- Ограничить максимальную ширину контейнера до 80-85% на 4K
- Использовать `max-width` для параграфов внутри компонентов (например, 80ch)
- Сохранить текущие размеры шрифтов (не уменьшать)

### Component Overflow

**Проблема:** Компоненты с фиксированной шириной могут переполняться на узких экранах.

**Решение:**
- Использовать `minmax()` с минимальной шириной, которая гарантирует читаемость
- Для MultiStyleSummaryGenerator: минимум 450px на колонку
- Для MetricCard: минимум 220px на колонку
- Для content-grid: минимум 350px на колонку

## Testing Strategy

### Manual Testing Checklist

#### Breakpoint Testing
- [ ] **Mobile (375px, 414px):** 1 колонка для всего, полная ширина
- [ ] **Tablet (768px, 1024px):** 2-3 колонки для метрик, 1-2 для контента
- [ ] **Desktop (1280px, 1440px):** 3 колонки для метрик, 2 для контента
- [ ] **Wide Desktop (1920px, 2048px):** 4-5 колонок для метрик, 2-3 для контента
- [ ] **Ultra Wide (2560px, 3840px):** 5-6 колонок для метрик, 3 для контента

#### Component Integrity Testing
- [ ] MetricCard: внутренние стили не изменились
- [ ] TopUsers: список отображается корректно
- [ ] AiInsights: текст и списки читаемы
- [ ] MultiStyleSummaryGenerator: карточки персон корректны
- [ ] ForumTopics: горизонтальный скролл работает
- [ ] Кнопки: размеры и цвета не изменились

#### Functional Testing
- [ ] Генерация AI отчетов работает на всех разрешениях
- [ ] Фильтрация по chat_id работает
- [ ] Фильтрация по thread_id работает
- [ ] Навигация между страницами работает
- [ ] Отправка в Telegram работает

#### Browser Testing
- [ ] Chrome (последняя версия)
- [ ] Firefox (последняя версия)
- [ ] Safari (последняя версия)
- [ ] Edge (последняя версия)

### Visual Regression Testing

**Метод:** Сравнение скриншотов до и после изменений

**Контрольные точки:**
1. Главная страница `/` на 1920px
2. Главная страница `/` на 2560px
3. Главная страница `/` на 3840px
4. Страница `/week` на 1920px
5. Страница с фильтром `?chat_id=123` на 2560px
6. Страница с сгенерированными AI отчетами на 3840px

**Критерии успеха:**
- Контент занимает 70-85% ширины на 4K
- Все компоненты видны без горизонтального скролла
- Текст читаем без увеличения масштаба
- Отступы и gap между элементами пропорциональны

### Performance Testing

**Метрики:**
- Time to First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1

**Инструменты:**
- Chrome DevTools Lighthouse
- WebPageTest.org

## Design Decisions & Rationales

### Decision 1: Использование CSS Grid вместо Flexbox

**Обоснование:**
- CSS Grid лучше подходит для двумерных layout (строки и колонки)
- `auto-fit` и `minmax()` обеспечивают автоматическую адаптацию
- Проще контролировать количество колонок на разных breakpoints
- Текущий код уже использует Grid, минимальные изменения

### Decision 2: Процентная ширина вместо фиксированной на широких экранах

**Обоснование:**
- 80-85% ширины обеспечивает баланс между использованием пространства и читаемостью
- Адаптируется к любому разрешению выше 2560px
- Оставляет "воздух" по краям для комфортного восприятия
- Избегает слишком длинных строк текста

### Decision 3: Сохранение всех компонентов без изменений

**Обоснование:**
- Пользователи привыкли к текущему дизайну
- Минимизирует риск регрессии
- Упрощает тестирование (только layout, не логика)
- Быстрая реализация (только CSS изменения)

### Decision 4: 5 уровней breakpoints

**Обоснование:**
- Покрывает все популярные разрешения
- Mobile (< 768px): смартфоны
- Tablet (768-1279px): планшеты и маленькие ноутбуки
- Desktop (1280-1919px): стандартные мониторы
- Wide Desktop (1920-2559px): Full HD и 2K мониторы
- Ultra Wide (≥ 2560px): 4K и выше

### Decision 5: Минимальная ширина колонок

**Обоснование:**
- MetricCard: 220-240px - достаточно для числа и лейбла
- Content sections: 350px - минимум для читаемого текста
- Persona cards: 450px - достаточно для контента отчета
- Предотвращает слишком узкие колонки на промежуточных разрешениях

## Accessibility Considerations

### Responsive Design
- Все breakpoints используют относительные единицы (px для media queries - стандарт)
- Контент адаптируется без потери функциональности
- Горизонтальный скролл отсутствует на всех разрешениях

### Text Readability
- Размеры шрифтов не изменяются (остаются читаемыми)
- Контраст цветов сохраняется
- Длина строк ограничена для комфортного чтения

### Keyboard Navigation
- Все интерактивные элементы доступны с клавиатуры
- Tab order логичен на всех разрешениях
- Focus states видны

## Future Enhancements

### Phase 2: Advanced Grid Features
- Drag-and-drop для изменения порядка компонентов
- Сохранение пользовательских настроек layout
- Переключатель "компактный/широкий" режим

### Phase 3: Dashboard Customization
- Выбор количества колонок вручную
- Скрытие/показ отдельных секций
- Экспорт layout настроек

### Phase 4: Performance Optimization
- Lazy loading для компонентов вне viewport
- Virtual scrolling для длинных списков
- Code splitting по breakpoints

## Appendix

### CSS Variables for Breakpoints

Для упрощения поддержки можно добавить CSS переменные:

```css
:root {
  --breakpoint-mobile: 768px;
  --breakpoint-tablet: 1280px;
  --breakpoint-desktop: 1920px;
  --breakpoint-wide: 2560px;
  
  --container-mobile: 100%;
  --container-tablet: 1200px;
  --container-desktop: 1400px;
  --container-wide: 85%;
  --container-ultra: 80%;
  
  --gap-small: 1rem;
  --gap-medium: 1.5rem;
  --gap-large: 2rem;
}
```

### Browser Support

Минимальные требования:
- Chrome 57+ (CSS Grid support)
- Firefox 52+ (CSS Grid support)
- Safari 10.1+ (CSS Grid support)
- Edge 16+ (CSS Grid support)

### Performance Impact

Ожидаемое влияние на производительность:
- **Layout recalculation:** Минимальное (CSS Grid оптимизирован)
- **Paint time:** Без изменений (те же компоненты)
- **Bundle size:** +2-3KB (дополнительный CSS)
- **Runtime performance:** Без изменений (только CSS)
