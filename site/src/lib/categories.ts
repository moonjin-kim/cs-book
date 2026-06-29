export interface CategoryGroup {
  id: string;
  title: string;
  description: string;
  domainIds: string[];
  focusSections?: CategoryFocusSection[];
}

export interface CategoryFocusSection {
  priority: number;
  title: string;
  question: string;
  domainIds: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'backend-core',
    title: 'Backend Core',
    description: '서버 개발 면접에서 가장 자주 묻는 언어, 프레임워크, 저장소, 메시징 핵심 질문입니다.',
    domainIds: ['java', 'spring', 'database', 'redis', 'kafka'],
    focusSections: [
      {
        priority: 1,
        title: 'Java 런타임과 동시성',
        question: 'JVM, GC, JMM, 컬렉션, Executor를 실행 원리와 장애 사례까지 설명할 수 있는가?',
        domainIds: ['java'],
      },
      {
        priority: 2,
        title: 'Spring 요청 처리와 트랜잭션',
        question: 'Bean, AOP proxy, MVC 흐름, @Transactional, JPA 영속성 컨텍스트를 연결해 설명할 수 있는가?',
        domainIds: ['spring'],
      },
      {
        priority: 3,
        title: 'Database 정합성과 성능',
        question: '트랜잭션 격리 수준, MVCC, 인덱스, 실행 계획, lock이 API 동작에 주는 영향을 설명할 수 있는가?',
        domainIds: ['database'],
      },
      {
        priority: 4,
        title: 'Redis 캐시와 분산 제어',
        question: '캐시 전략, stampede, stale data, 분산 락, persistence, cluster trade-off를 설명할 수 있는가?',
        domainIds: ['redis'],
      },
      {
        priority: 5,
        title: 'Kafka 메시징과 이벤트 처리',
        question: 'partition, consumer group, offset commit, 재처리, 멱등성, 전달 보장을 설명할 수 있는가?',
        domainIds: ['kafka'],
      },
      {
        priority: 6,
        title: '백엔드 통합 설계',
        question: 'DB, cache, message broker를 함께 쓸 때 이중 쓰기, 재시도, idempotency, 장애 전파를 어떻게 다룰 것인가?',
        domainIds: ['spring', 'database', 'redis', 'kafka'],
      },
    ],
  },
  {
    id: 'web-network',
    title: 'Web & Network',
    description: '브라우저 요청이 서버에 도착하기까지의 흐름과 HTTP, 네트워크, 보안 기본기입니다.',
    domainIds: ['network', 'web-http', 'security'],
  },
  {
    id: 'cs-foundation',
    title: 'CS Foundation',
    description: '알고리즘, 운영체제, 컴퓨터 구조, 객체지향처럼 모든 백엔드 질문의 바탕이 되는 주제입니다.',
    domainIds: ['algorithms', 'operating-system', 'computer-architecture', 'oop'],
  },
  {
    id: 'architecture-ops',
    title: 'Architecture & Operations',
    description: '장애, 확장, 배포, 관측처럼 실제 서비스를 운영할 때 필요한 시스템 설계 질문입니다.',
    domainIds: ['distributed-systems', 'devops-cloud'],
  },
];

export function findCategoryGroup(domainId: string) {
  return CATEGORY_GROUPS.find((group) => group.domainIds.includes(domainId));
}
