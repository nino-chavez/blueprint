(() => {
  const scenarios = {
    complete: {
      state: 'Ready for concepts',
      tone: 'ready',
      message: 'All scoped records have a current reviewed disposition. Concepts may begin only where concept-work authority already exists.',
      blocker: 'None in this illustration',
      remedy: 'Keep the review current; obtain or verify the separate authorization for concept work.'
    },
    journey: {
      state: 'Blocked: missing journey',
      tone: 'blocked',
      message: 'The actor has a story and a screen, but no complete written and visual route through the scoped interaction IDs.',
      blocker: 'J-1 is absent or does not connect its trigger, steps, outcome, and recovery.',
      remedy: 'Add the written and diagrammed journey, then have the current definition reviewed again.'
    },
    permission: {
      state: 'Blocked: permission unresolved',
      tone: 'blocked',
      message: 'A Save control can be drawn, but the application has not decided who may use it or what a denial does.',
      blocker: 'No reviewed allow or deny decision matches the actor, action, resource, and scope.',
      remedy: 'Record the decision and its source. Show the denied path and recovery before comparing dependent concepts.'
    },
    state: {
      state: 'Blocked: state disposition missing',
      tone: 'blocked',
      message: 'The surface names ready and complete states, yet an applicable obligation has no reviewed covered or not-applicable disposition.',
      blocker: 'A scoped state row is absent, not merely unfinished styling.',
      remedy: 'Add the state or a reviewed reason it is not applicable; keep omitted and not-applicable distinct.'
    },
    stale: {
      state: 'Blocked: evidence stale',
      tone: 'blocked',
      message: 'A requirement, scope, source capability, journey, or review method changed after the evidence was recorded.',
      blocker: 'The receipt no longer identifies the definition being considered.',
      remedy: 'Re-derive the affected review from current inputs. Do not treat an old pass as a pass for newer work.'
    }
  };

  const root = document.querySelector('[data-gate-demo]');
  if (!root) return;
  const buttons = [...root.querySelectorAll('[data-scenario]')];
  const state = root.querySelector('[data-gate-state]');
  const message = root.querySelector('[data-gate-message]');
  const blocker = root.querySelector('[data-gate-blocker]');
  const remedy = root.querySelector('[data-gate-remedy]');

  const selectScenario = (key) => {
    const item = scenarios[key];
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.scenario === key)));
    state.textContent = item.state;
    state.classList.toggle('is-blocked', item.tone === 'blocked');
    message.textContent = item.message;
    blocker.textContent = item.blocker;
    remedy.textContent = item.remedy;
  };

  buttons.forEach((button) => button.addEventListener('click', () => selectScenario(button.dataset.scenario)));
})();
