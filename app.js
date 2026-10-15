'use strict';

const bookingDialog = document.querySelector('#booking-dialog');
const infoDialog = document.querySelector('#info-dialog');
const bookingForm = document.querySelector('#booking-form');
const formView = document.querySelector('#booking-form-view');
const reviewView = document.querySelector('#booking-review');
const dateInput = bookingForm.elements.date;
const timeSelect = bookingForm.elements.time;
const dateHint = document.querySelector('#date-hint');
let bookingReturnFocus = null;

function localDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function updateTimes() {
  dateInput.min = localDateString(new Date());
  dateInput.setCustomValidity('');
  dateHint.textContent = '예시 진료 시간 기준입니다. 공휴일 여부는 반영되지 않습니다.';
  const previousTime = timeSelect.value;
  timeSelect.replaceChildren(new Option('시간을 선택해주세요', ''));
  timeSelect.disabled = !dateInput.value;
  if (!dateInput.value) return;
  const selectedDate = new Date(`${dateInput.value}T00:00:00`);
  if (!Number.isFinite(selectedDate.getTime())) return;
  if (dateInput.value < dateInput.min) {
    dateInput.setCustomValidity('오늘 이후의 날짜를 선택해주세요.');
    dateHint.textContent = '오늘 이후의 날짜를 선택해주세요.';
    timeSelect.disabled = true;
    return;
  }
  const weekday = selectedDate.getDay();
  if (weekday === 0) {
    dateInput.setCustomValidity('일요일은 휴진입니다. 다른 날짜를 선택해주세요.');
    dateHint.textContent = '일요일은 휴진입니다. 다른 날짜를 선택해주세요.';
    timeSelect.disabled = true;
    return;
  }
  const endHour = weekday === 6 ? 14 : weekday === 3 ? 20 : 19;
  const now = new Date();
  for (let hour = 10; hour < endHour; hour++) {
    if (weekday !== 6 && hour === 13) continue;
    for (const minute of [0, 30]) {
      const value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      if (dateInput.value === localDateString(now) && new Date(`${dateInput.value}T${value}:00`) <= now) continue;
      timeSelect.add(new Option(value, value));
    }
  }
  if (timeSelect.options.length === 1) {
    dateInput.setCustomValidity('오늘 선택할 수 있는 시간이 없습니다. 다른 날짜를 선택해주세요.');
    timeSelect.disabled = true;
    dateHint.textContent = '오늘 선택할 수 있는 시간이 없습니다. 다른 날짜를 선택해주세요.';
  } else if ([...timeSelect.options].some(option => option.value === previousTime)) {
    timeSelect.value = previousTime;
  }
}

function closeMenu() {
  const toggle = document.querySelector('.menu-toggle');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', '메뉴 열기');
  document.querySelector('#mobile-nav').classList.remove('open');
  document.querySelector('#mobile-nav').inert = true;
}

function openBooking(program, trigger) {
  closeMenu();
  if (infoDialog.open) infoDialog.close();
  bookingReturnFocus = trigger || document.activeElement;
  formView.hidden = false;
  reviewView.hidden = true;
  bookingDialog.setAttribute('aria-labelledby', 'booking-title');
  if (program) bookingForm.elements.program.value = program;
  updateTimes();
  bookingDialog.showModal();
}

document.querySelectorAll('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(null, button)));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});
bookingDialog.addEventListener('close', () => {
  bookingForm.reset();
  dateInput.setCustomValidity('');
  updateTimes();
  document.querySelector('#review-content').replaceChildren();
  formView.hidden = false;
  reviewView.hidden = true;
  bookingReturnFocus?.focus();
});
dateInput.addEventListener('change', updateTimes);
dateInput.addEventListener('input', updateTimes);
bookingForm.elements.phone.addEventListener('input', event => {
  event.target.value = event.target.value.replace(/[^0-9-]/g, '');
});
bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  updateTimes();
  if (!bookingForm.reportValidity()) return;
  const name = bookingForm.elements.name.value.trim();
  if (!name) {
    bookingForm.elements.name.setCustomValidity('이름을 입력해주세요.');
    bookingForm.elements.name.reportValidity();
    return;
  }
  const summary = document.querySelector('#review-content');
  summary.replaceChildren();
  const date = new Date(`${dateInput.value}T00:00:00`).toLocaleDateString('ko-KR', {year:'numeric', month:'long', day:'numeric', weekday:'short'});
  const entries = [['이름', name], ['연락처', bookingForm.elements.phone.value], ['관심 프로그램', bookingForm.elements.program.selectedOptions[0].textContent], ['희망 일정', `${date} ${timeSelect.value}`]];
  for (const [key, value] of entries) {
    const row = document.createElement('div');
    const label = document.createElement('dt');
    const content = document.createElement('dd');
    label.textContent = key;
    content.textContent = value;
    row.append(label, content);
    summary.append(row);
  }
  formView.hidden = true;
  reviewView.hidden = false;
  bookingDialog.setAttribute('aria-labelledby', 'review-title');
  bookingDialog.scrollTop = 0;
  document.querySelector('#review-title').focus();
});
bookingForm.elements.name.addEventListener('input', () => bookingForm.elements.name.setCustomValidity(''));
document.querySelector('#edit-booking').addEventListener('click', () => {
  formView.hidden = false;
  reviewView.hidden = true;
  bookingDialog.setAttribute('aria-labelledby', 'booking-title');
  bookingForm.elements.name.focus();
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectCategory(tab) {
  const category = tab.dataset.category;
  tabs.forEach(item => {
    item.setAttribute('aria-selected', String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });
  const panel = document.querySelector('#care-panel');
  panel.setAttribute('aria-labelledby', tab.id);
  panel.classList.toggle('filtered', category !== 'all');
  document.querySelectorAll('[data-care]').forEach(card => card.hidden = category !== 'all' && card.dataset.care !== category);
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectCategory(tab));
  tab.addEventListener('keydown', event => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectCategory(tabs[nextIndex]);
    tabs[nextIndex].focus();
  });
});

const programs = {
  elasticity: {title:'탄력 · 리프팅', subtitle:'피부의 탄탄한 균형', text:'탄력의 변화는 피부 두께, 생활 습관, 얼굴의 구조 등 여러 요소와 연결되어 있습니다. 현재 상태와 원하는 변화를 먼저 확인합니다.', points:['탄력과 얼굴선에 대한 고민 상담','피부 상태와 진료 이력을 고려한 계획','진료 과정 및 사후 관리 안내']},
  tone: {title:'색소 · 피부톤', subtitle:'맑고 고른 피부의 빛', text:'눈에 보이는 색소 고민도 종류와 양상이 서로 다를 수 있습니다. 피부 상태와 이전 진료 이력을 살펴 상담을 진행합니다.', points:['피부톤과 색소 고민 확인','최근 피부 변화 및 관리 습관 상담','개인 상태를 고려한 진료 방향 안내']},
  texture: {title:'모공 · 피부결', subtitle:'가까이서도 편안한 피부', text:'피부결이 거칠게 느껴지는 이유와 모공 고민을 함께 살펴봅니다. 평소 관리 방법과 피부의 반응을 듣고 필요한 방향을 설명합니다.', points:['모공과 피부결 고민 상담','현재의 관리 습관과 피부 상태 확인','진료와 일상 관리 방향 안내']},
  trouble: {title:'여드름 · 민감 피부', subtitle:'피부가 편안해지는 시간', text:'반복되는 피부 고민을 이해하기 위해 증상의 변화와 생활 속 자극 요인을 함께 살펴봅니다. 자극에 대한 반응과 진료 이력을 알려주세요.', points:['트러블의 변화와 피부 민감도 상담','사용 제품과 생활 습관 확인','현재 상태를 고려한 진료 계획']}
};
document.querySelectorAll('[data-detail]').forEach(button => button.addEventListener('click', () => {
  const program = programs[button.dataset.detail];
  document.querySelector('#info-kicker').textContent = program.subtitle;
  document.querySelector('#info-title').textContent = program.title;
  const container = document.querySelector('#info-content');
  container.replaceChildren();
  const intro = document.createElement('p');
  intro.textContent = program.text;
  const heading = document.createElement('h3');
  heading.textContent = '상담에서 함께 살펴볼 내용';
  const list = document.createElement('ul');
  program.points.forEach(point => {const item = document.createElement('li');item.textContent = point;list.append(item);});
  const note = document.createElement('p');
  note.className = 'detail-note';
  note.textContent = '디자인 시안을 위한 예시 안내입니다. 실제 진료 여부와 방법, 부작용 및 주의사항은 의료진 상담을 통해 확인해야 합니다.';
  container.append(intro, heading, list, note);
  const bookButton = document.querySelector('#info-book');
  bookButton.hidden = false;
  bookButton.onclick = () => openBooking(button.dataset.detail, button);
  infoDialog.showModal();
}));

const policies = {
  privacy:{title:'개인정보처리방침 안내', text:'이 디자인 시안은 상담 입력 정보를 서버로 전송하거나 브라우저 저장소에 저장하지 않습니다. 입력값은 열려 있는 상담 화면에서만 사용하며, 창을 닫으면 지워집니다. 실제 운영 시에는 병원의 개인정보 처리 목적, 수집 항목, 보유 기간, 위탁 여부 및 담당자 정보를 반영한 방침을 마련해야 합니다. 외부 웹폰트 로딩을 위해 Google Fonts에 연결하며, 연결이 되지 않으면 기기에 설치된 글꼴로 표시합니다.'},
  terms:{title:'이용 안내', text:'본 페이지는 가상의 오브 피부과를 소개하는 웹사이트 디자인 시안입니다. 진료 항목과 운영 시간은 예시이며, 실제 의료기관의 정보가 아닙니다. 상담 내용 확인 기능은 체험용으로 예약 접수나 확정을 수행하지 않습니다. 실제 서비스 운영 전 병원 정보와 예약 연동 구성이 필요합니다.'},
  demo:{title:'오브 피부과 디자인 시안', text:'오브 피부과는 이 페이지를 위해 만든 가상 브랜드입니다. 사진은 AI로 생성한 브랜드 및 공간 콘셉트이며 실제 환자, 의료진 또는 시설이 아닙니다. 프로그램 분류, 진료 시간, 상담 과정은 예시입니다. 실제 병원 정보에 맞게 문구와 사진을 교체하고 상담 접수 서비스를 연결하여 사용할 수 있습니다.'}
};
document.querySelectorAll('[data-policy]').forEach(button => button.addEventListener('click', () => {
  const policy = policies[button.dataset.policy];
  document.querySelector('#info-kicker').textContent = '웹사이트 안내';
  document.querySelector('#info-title').textContent = policy.title;
  const text = document.createElement('p');
  text.textContent = policy.text;
  document.querySelector('#info-content').replaceChildren(text);
  document.querySelector('#info-book').hidden = true;
  infoDialog.showModal();
}));

document.querySelector('.menu-toggle').addEventListener('click', () => {
  const toggle = document.querySelector('.menu-toggle');
  const isOpen = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  document.querySelector('#mobile-nav').classList.toggle('open', isOpen);
  document.querySelector('#mobile-nav').inert = !isOpen;
});
document.querySelectorAll('#mobile-nav a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeMenu();
});
window.matchMedia('(min-width: 681px)').addEventListener('change', event => {if(event.matches) closeMenu();});
updateTimes();
