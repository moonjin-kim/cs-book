export interface CategoryGroup {
  id: string;
  title: string;
  description: string;
  domainIds: string[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: 'backend-core',
    title: 'Backend Core',
    description: '서버 개발 면접에서 가장 자주 묻는 언어, 프레임워크, 저장소, 메시징 핵심 질문입니다.',
    domainIds: ['java', 'spring', 'database', 'redis', 'kafka'],
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
