/* 员工目录与扫码登录演示：只保存来源身份标记和权限，不连接真实组织或保存密钥。 */
const ORG_ROSTER={
  feishu:[
    {externalId:'fs-001',name:'张管理员',department:'管理部',role:'企业管理员'},
    {externalId:'fs-002',name:'陈运营',department:'电商运营部',role:'运营'},
    {externalId:'fs-003',name:'李分析',department:'数据分析部',role:'分析师'},
    {externalId:'fs-004',name:'王采购',department:'采购部',role:'采购'},
    {externalId:'fs-005',name:'赵运营',department:'电商运营部',role:'运营'}
  ],
  dingtalk:[
    {externalId:'dt-101',name:'周主管',department:'运营部',role:'运营主管'},
    {externalId:'dt-102',name:'孙商品',department:'商品部',role:'商品专员'},
    {externalId:'dt-103',name:'吴财务',department:'财务部',role:'财务'}
  ]
};
const ORG_MENUS=['工作台','待确认建议','运行记录','数据平台','MCP 中心','Agent 中心','知识库','应用市场','自动执行','企业管理'];
const ORG_PROVIDER_NAME={feishu:'飞书',dingtalk:'钉钉'};
let orgFilter={source:'',department:'',state:'',keyword:''};
let orgPage=1,orgPageSize=10;

function orgHydrate(){
  data.orgConnections??=copy(seed.orgConnections);
  data.orgEvents??=[];
  for(const [i,e] of data.employees.entries()){
    e.provider??='飞书';e.externalId??=`legacy-${i+1}`;e.department??='未分组';e.state??='正常';e.lastLogin??='尚未登录';
  }
}
function orgLog(message){data.orgEvents.unshift({message,at:new Date().toLocaleString('zh-CN')});data.orgEvents=data.orgEvents.slice(0,15)}
function orgConnection(id){return data.orgConnections.find(x=>x.id===id)}
function orgImported(id,externalId){return data.employees.some(e=>e.provider===ORG_PROVIDER_NAME[id]&&e.externalId===externalId)}
function orgCanLogin(e){return e?.state==='正常'&&orgConnection(e.provider==='飞书'?'feishu':'dingtalk')?.loginEnabled}
function orgPermissionsTab(){
  const connected=data.orgConnections.filter(c=>c.state==='已连接').length;
  const enabled=data.employees.filter(e=>e.state==='正常').length;
  const logged=data.employees.filter(e=>e.lastLogin&&e.lastLogin!=='尚未登录').length;
  const departments=[...new Set(data.employees.filter(e=>!orgFilter.source||e.provider===orgFilter.source).map(e=>`${e.provider}|${e.department}`))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  const rows=data.employees.map((e,i)=>({e,i})).filter(({e})=>(!orgFilter.source||e.provider===orgFilter.source)&&(!orgFilter.department||`${e.provider}|${e.department}`===orgFilter.department)&&(!orgFilter.state||e.state===orgFilter.state)&&(!orgFilter.keyword||`${e.name} ${e.department} ${e.externalId}`.toLocaleLowerCase().includes(orgFilter.keyword.toLocaleLowerCase())));
  const pages=Math.max(1,Math.ceil(rows.length/orgPageSize));orgPage=Math.min(orgPage,pages);
  const visible=rows.slice((orgPage-1)*orgPageSize,orgPage*orgPageSize);
  return `<div class="org-hero card"><div><div class="eyebrow">IDENTITY & ACCESS</div><h2>组织成员与身份接入</h2><p>从飞书或钉钉同步员工，由管理员选择导入并配置权限；员工使用所属平台扫码登录。</p></div><div class="org-hero-actions">${btn('扫码登录演示','org-login','','secondary')}${btn('导入员工','org-choose-import','','')}</div></div>
  <div class="org-stats"><div class="card"><strong>${connected}<small> / 2</small></strong><span>已连接组织</span></div><div class="card"><strong>${data.employees.length}</strong><span>平台员工</span></div><div class="card"><strong>${enabled}</strong><span>可登录员工</span></div><div class="card"><strong>${logged}</strong><span>已有登录记录</span></div></div>
  <div class="org-section-head"><div><h2>组织连接</h2><p>企业管理员维护应用接入，按部门范围同步通讯录。</p></div><span class="org-section-note">01 接入　→　02 导入　→　03 授权　→　04 扫码登录</span></div>
  <div class="org-connections">${data.orgConnections.map(c=>`<div class="card org-connection"><div class="org-provider-icon ${c.id}">${c.id==='feishu'?'飞':'钉'}</div><div class="org-connection-body"><div class="org-card-top"><div><h3>${esc(c.name)}</h3><span class="cell-sub">企业自建应用 · 通讯录与扫码身份</span></div>${status(c.state)}</div><div class="org-connection-meta"><span>同步范围 <b>${esc(c.scope)}</b></span><span>上次同步 <b>${esc(c.lastSync)}</b></span><span>员工登录 <b>${c.loginEnabled?'已启用':'未启用'}</b></span></div><div class="inline-actions">${btn(c.state==='已连接'?'维护连接':'配置连接','org-config',c.id,'secondary small')}${c.state==='已连接'?`${btn('拉取员工','org-import',c.id,'small')}${btn('同步变更','org-sync',c.id,'secondary small')}`:''}</div></div></div>`).join('')}</div>
  <div class="org-section-head org-employee-head"><div><h2>员工与权限</h2><p>菜单、Agent 与店铺权限分别授予；导入的新员工默认待开通。</p></div></div>
  <div class="card org-employee-panel"><div class="org-filters"><label>来源<select data-org-filter="source"><option value="">全部来源</option>${['飞书','钉钉'].map(x=>`<option ${orgFilter.source===x?'selected':''}>${x}</option>`).join('')}</select></label><label>组织架构<select data-org-filter="department"><option value="">全部部门</option>${departments.map(value=>{let [provider,department]=value.split("|");return `<option value="${esc(value)}" ${orgFilter.department===value?"selected":""}>${esc(orgFilter.source?department:`${provider} · ${department}`)}</option>`}).join("")}</select></label><label>状态<select data-org-filter="state"><option value="">全部状态</option>${['正常','待开通','已停用'].map(x=>`<option ${orgFilter.state===x?'selected':''}>${x}</option>`).join('')}</select></label><label class="org-search">搜索员工<input type="search" data-org-filter="keyword" value="${esc(orgFilter.keyword)}" placeholder="姓名、部门、外部 ID"></label>${btn('清空','org-clear','','secondary small')}</div><div class="table-wrap"><table class="table org-table"><thead><tr><th>员工</th><th>来源 / 部门</th><th>登录状态</th><th>可见板块</th><th>可用 Agent</th><th>店铺范围</th><th>操作</th></tr></thead><tbody>${visible.length?visible.map(({e,i})=>`<tr><td><strong>${esc(e.name)}</strong><div class="cell-sub">${esc(e.role)}</div></td><td>${esc(e.provider)} · ${esc(e.department)}<div class="cell-sub">ID ${esc(e.externalId)}</div></td><td>${status(e.state)}<div class="cell-sub">${esc(e.lastLogin)}</div></td><td>${esc(e.menus)}</td><td>${esc(e.agents)}</td><td>${esc(e.stores)}</td><td><div class="org-row-actions">${link('配置权限','org-edit',String(i))}${e.role!=='企业管理员'?link(e.state==='已停用'?'重新启用':'停用','org-toggle',String(i)):''}</div></td></tr>`).join(''):'<tr><td colspan="7" class="org-empty">没有符合条件的员工</td></tr>'}</tbody></table></div><div class="org-table-foot"><span>共 ${rows.length} 位员工 · 第 ${orgPage} / ${pages} 页</span><div class="org-page-controls"><label>每页 <select data-org-size>${[10,20,50].map(n=>`<option value="${n}" ${orgPageSize===n?'selected':''}>${n} 条</option>`).join('')}</select></label><button type="button" data-action="org-page" data-id="${orgPage-1}" ${orgPage===1?'disabled':''}>上一页</button><button type="button" data-action="org-page" data-id="${orgPage+1}" ${orgPage===pages?'disabled':''}>下一页</button></div></div></div>
  `;
}
function orgModal(type,id){
  const c=orgConnection(id),person=data.employees[Number(id)];
  if(type==='org-choose-import')return modalBox('选择组织来源',`<p class="muted">先连接企业自建应用，再按部门拉取员工。导入后由管理员分配使用权限。</p><div class="org-source-picker">${data.orgConnections.map(x=>`<button type="button" class="org-source-option" data-action="${x.state==='已连接'?'org-import':'org-config'}" data-id="${x.id}"><span class="org-provider-icon ${x.id}">${x.id==='feishu'?'飞':'钉'}</span><strong>${esc(x.name)}</strong>${status(x.state)}<span>→</span></button>`).join('')}</div>`);
  if(type==='org-config')return modalBox(`${esc(c.name)}组织连接`,`<div class="org-flow-note"><span>1 配置应用</span><span>2 授权通讯录</span><span>3 选择部门</span><span>4 启用扫码登录</span></div><div class="notice blue"><b>ⓘ</b><span>请在${esc(c.name)}开放平台创建企业自建应用，开通通讯录读取与网页登录能力，并设置登录回调。此处是本地交互演示，不访问开放平台，也不保存密钥。</span></div><form id="org-config-form" data-id="${esc(id)}"><div class="form-grid" style="margin-top:18px"><div class="field"><label>应用 ID</label><input name="appId" placeholder="演示应用 ID" autocomplete="off" required></div><div class="field"><label>应用密钥</label><input name="appSecret" type="password" placeholder="演示占位值，请勿输入真实密钥" autocomplete="new-password" required></div><div class="field wide"><label>登录回调地址</label><input name="redirect" type="url" placeholder="https://example.com/auth/callback" required></div><div class="field wide"><label>同步部门范围</label><select name="scope"><option>全部部门</option><option>运营相关部门</option><option>指定部门（演示）</option></select></div></div><label class="org-switch"><input type="checkbox" name="loginEnabled" ${c.loginEnabled?'checked':''}><span>允许已开通员工使用${esc(c.name)}扫码登录</span></label></form><p class="field-help">正式接入还需校验企业身份、应用授权与回调域名；演示仅保存“已连接”状态。</p>`,`<button type="submit" form="org-config-form" class="btn">保存连接（演示）</button>`,true);
  if(type==='org-import'){
    const roster=ORG_ROSTER[id]||[],fresh=roster.filter(x=>!orgImported(id,x.externalId)).length;
    return modalBox(`从${esc(c.name)}导入员工`,`<div class="org-flow-note"><span class="done">连接完成</span><span class="current">选择员工</span><span>配置权限</span><span>扫码登录</span></div><div class="org-import-summary"><strong>${roster.length}</strong><span>通讯录员工</span><strong>${fresh}</strong><span>可导入</span><strong>${roster.length-fresh}</strong><span>已存在</span></div><form id="org-import-form" data-id="${esc(id)}"><div class="org-import-list">${roster.map(x=>{let imported=orgImported(id,x.externalId),conflict=!imported&&data.employees.some(e=>e.name===x.name);return `<label class="org-import-person ${imported||conflict?'is-disabled':''}"><input type="checkbox" name="members" value="${esc(x.externalId)}" ${imported||conflict?'disabled':'checked'}><span class="org-person-avatar">${esc(x.name.slice(0,1))}</span><span><strong>${esc(x.name)}</strong><small>${esc(x.department)} · ${esc(x.role)} · ${esc(x.externalId)}</small></span><em>${imported?'已导入':conflict?'同名待核对':'待选择'}</em></label>`}).join('')}</div></form><div class="notice blue"><b>ⓘ</b><span>仅导入勾选员工；新员工初始为“待开通”，无板块、Agent 和店铺权限。同名但外部 ID 不同的身份需人工核对。</span></div>`,`<button type="submit" form="org-import-form" class="btn" ${fresh?'':'disabled'}>导入选中员工</button>`,true);
  }
  if(type==='org-sync')return modalBox(`${esc(c.name)}通讯录同步`,`<div class="org-flow-note"><span class="done">已连接</span><span class="current">预览变更</span><span>确认同步</span></div><div class="org-sync-preview"><div><strong>新增成员</strong><span>${(ORG_ROSTER[id]||[]).filter(x=>!orgImported(id,x.externalId)).length} 位可选择导入</span></div><div><strong>资料更新</strong><span>部门与角色按外部 ID 更新</span></div><div><strong>离职停用</strong><span>本次演示无离职事件</span></div></div><div class="notice blue"><b>ⓘ</b><span>同步只更新身份与组织资料，不改写已授予的业务权限。正式产品收到离职或应用失权事件时应立即禁止登录与 Agent 执行，并保留历史记录。</span></div>`,`${btn('仅同步现有员工','org-do-sync',id,'secondary')}${btn('查看可导入成员','org-import',id,'')}`);
  if(type==='org-edit'){
    const selected=e=>e==='全部板块'?ORG_MENUS:person.menus.split('、');
    const menuList=selected(person.menus);
    const agentList=person.agents==='全部 Agent'?data.agents.map(a=>a.name):person.agents.split('、');
    const storeList=person.stores==='全部已授权店铺'?authorizedStores():person.stores.split('、');
    return modalBox(`配置 ${esc(person.name)} 的权限`,`<div class="org-identity"><span class="org-person-avatar">${esc(person.name.slice(0,1))}</span><div><strong>${esc(person.name)} · ${esc(person.role)}</strong><small>${esc(person.provider)} / ${esc(person.department)} / ${esc(person.externalId)}</small></div>${status(person.state)}</div><form id="org-permission-form" data-id="${esc(id)}"><div class="org-permission-group"><div class="org-permission-head"><strong>01 可见板块</strong><small>决定导航入口是否可见</small></div><div class="org-checkbox-grid">${ORG_MENUS.map(x=>`<label><input type="checkbox" name="menus" value="${esc(x)}" ${menuList.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div></div><div class="org-permission-group"><div class="org-permission-head"><strong>02 Agent 使用权</strong><small>只授予需要的 Agent</small></div><div class="org-checkbox-grid">${data.agents.map(a=>`<label><input type="checkbox" name="agents" value="${esc(a.name)}" ${agentList.includes(a.name)?'checked':''}>${esc(a.name)}</label>`).join('')}</div></div><div class="org-permission-group"><div class="org-permission-head"><strong>03 店铺数据范围</strong><small>与 ERP 授权、Agent 范围取交集</small></div><div class="org-checkbox-grid">${authorizedStores().map(x=>`<label><input type="checkbox" name="stores" value="${esc(x)}" ${storeList.includes(x)?'checked':''}>${esc(x)}</label>`).join('')}</div></div><div class="notice blue"><b>ⓘ</b><span>保存后即时生效；已有自动执行规则在下次运行前重新校验负责人权限。</span></div></form>`,`<button type="submit" form="org-permission-form" class="btn">保存并开通</button>`,true);
  }
  if(type==='org-login'){
    const eligible=data.employees.filter(e=>e.provider===ORG_PROVIDER_NAME[id]||!id);
    const platform=id||'feishu',connection=orgConnection(platform);
    return modalBox('员工扫码登录',`<div class="org-login-layout"><div class="org-qr"><div class="org-qr-pattern" aria-hidden="true"><span>DEMO</span></div><strong>使用${esc(connection.name)}扫码</strong><small>二维码为示意图，不具备登录能力</small></div><div class="org-login-side"><div class="eyebrow">EMPLOYEE SIGN IN</div><h3>使用企业已有身份进入境枢 AI</h3><p>扫码并在手机端确认后，系统用组织平台返回的身份定位企业员工，再检查账号状态与当前权限。</p><div class="field"><label>登录平台</label><select id="org-login-platform" data-org-login="platform">${data.orgConnections.map(x=>`<option value="${x.id}" ${platform===x.id?'selected':''}>${esc(x.name)} · ${esc(x.state)}</option>`).join('')}</select></div><div class="field"><label>演示员工</label><select id="org-login-person">${eligible.filter(e=>e.provider===connection.name).map(e=>`<option value="${esc(e.externalId)}">${esc(e.name)} · ${esc(e.state)}</option>`).join('')||'<option value="">暂无该平台员工</option>'}</select></div><div class="org-login-status">${connection.loginEnabled?'等待扫码确认（演示）':'该平台尚未启用扫码登录'}</div></div></div>`,btn('模拟扫码并确认','org-confirm-login',platform,''),true);
  }
  if(type==='org-login-result')return modalBox('扫码登录成功',`<div class="org-login-success">✓</div><h3 class="org-result-title">${esc(person.name)}，欢迎使用境枢 AI</h3><p class="muted">已完成企业身份与员工状态校验（演示）。实际登录需服务端完成授权回调、一次性会话建立与审计。</p><div class="detail-rows">${row('身份来源',esc(person.provider))}${row('员工角色',esc(person.role))}${row('可用 Agent',esc(person.agents))}${row('店铺范围',esc(person.stores))}${row('本次登录',esc(person.lastLogin))}</div>`,btn('返回员工管理','org-finish-login','',''));
  return '';
}

document.addEventListener('click',ev=>{
  const el=ev.target.closest('[data-action^="org-"]');if(!el)return;ev.preventDefault();ev.stopImmediatePropagation();
  const action=el.dataset.action,id=el.dataset.id;
  if(action==='org-clear'){orgFilter={source:'',department:'',state:'',keyword:''};orgPage=1;render();return}
  if(action==='org-page'){orgPage=Number(id);render();return}
  if(action==='org-toggle'){
    const e=data.employees[Number(id)];if(!e||e.role==='企业管理员')return;
    e.state=e.state==='已停用'?'待开通':'已停用';orgLog(`${e.name} ${e.state==='已停用'?'已停用':'恢复待开通'}`);save();render();toast(e.state==='已停用'?'员工已停用，登录与运行权限失效':'员工已恢复为待开通');return;
  }
  if(action==='org-do-sync'){
    const c=orgConnection(id);for(const item of ORG_ROSTER[id]||[]){let e=data.employees.find(x=>x.provider===c.name&&x.externalId===item.externalId);if(e){e.department=item.department;e.role=item.role}}
    c.lastSync=new Date().toLocaleString('zh-CN');orgLog(`${c.name}通讯录已同步现有员工资料`);save();modal=null;render();toast('现有员工资料已同步（演示）');return;
  }
  if(action==='org-confirm-login'){
    const connection=orgConnection(id),externalId=document.querySelector('#org-login-person')?.value,e=data.employees.find(x=>x.provider===connection.name&&x.externalId===externalId);
    if(!connection.loginEnabled){toast('该平台未启用扫码登录');return}
    if(!e){toast('请选择已导入的平台员工');return}
    if(!orgCanLogin(e)){toast(`${e.name}尚未开通或已停用，请联系企业管理员`);return}
    e.lastLogin=new Date().toLocaleString('zh-CN');orgLog(`${e.name}通过${connection.name}扫码登录（演示）`);save();modal={type:'org-login-result',id:String(data.employees.indexOf(e))};render();return;
  }
  if(action==='org-finish-login'){modal=null;render();return}
  modal={type:action,id};render();queueMicrotask(()=>document.querySelector('.modal input:not([type=hidden]),.modal select,.modal .close')?.focus());
});
document.addEventListener('submit',ev=>{
  const form=ev.target;if(!['org-config-form','org-import-form','org-permission-form'].includes(form.id))return;
  ev.preventDefault();ev.stopImmediatePropagation();const values=new FormData(form),id=form.dataset.id;
  if(form.id==='org-config-form'){
    const c=orgConnection(id);if(!c)return;
    c.state='已连接';c.scope=values.get('scope');c.loginEnabled=values.has('loginEnabled');c.lastSync=c.lastSync==='—'?'尚未同步':c.lastSync;
    orgLog(`${c.name}连接配置已保存（演示）`);save();modal=null;render();toast(`${c.name}连接已配置（演示），请拉取员工`);return;
  }
  if(form.id==='org-import-form'){
    const source=orgConnection(id);if(source.state!=='已连接'){toast('请先配置组织连接');return}
    const ids=values.getAll('members'),roster=ORG_ROSTER[id]||[];if(!ids.length){toast('请至少选择一位员工');return}
    let count=0;for(const person of roster){if(!ids.includes(person.externalId)||orgImported(id,person.externalId)||data.employees.some(e=>e.name===person.name))continue;
      data.employees.push({name:person.name,role:person.role,provider:source.name,externalId:person.externalId,department:person.department,state:'待开通',lastLogin:'尚未登录',menus:'无',agents:'无',stores:'无'});count++}
    source.lastSync=new Date().toLocaleString('zh-CN');orgLog(`从${source.name}导入 ${count} 位员工，待配置权限`);save();modal=null;render();toast(`已导入 ${count} 位员工，请配置权限`);return;
  }
  if(form.id==='org-permission-form'){
    const e=data.employees[Number(id)];if(!e)return;
    const menus=values.getAll('menus'),agents=values.getAll('agents'),stores=values.getAll('stores');
    if(e.role==='企业管理员'&&(!menus.length||!stores.length)){toast('企业管理员至少需要保留一个板块和一个店铺权限');return}
    e.menus=menus.length?menus.join('、'):'无';e.agents=agents.length?agents.join('、'):'无';e.stores=stores.length?stores.join('、'):'无';
    // Agent 配置与员工权限取交集，保存时同步成员名单，避免展示已授权但运行被拒。
    for(const agent of data.agents){let allowed=agents.includes(agent.name);agent.employees=agent.employees.filter(name=>name!==e.name);if(allowed)agent.employees.push(e.name);if(agent.live){agent.live.employees=agent.live.employees.filter(name=>name!==e.name);if(allowed)agent.live.employees.push(e.name)}}
    if(e.state!=='已停用')e.state=menus.length?'正常':'待开通';orgLog(`${e.name}的板块、Agent 与店铺权限已更新`);save();modal=null;render();toast(`${e.name}的权限已保存`);return;
  }
});
document.addEventListener('change',ev=>{
  if(ev.target.matches('[data-org-filter]')){const field=ev.target.dataset.orgFilter;orgFilter[field]=ev.target.value;if(field==='source')orgFilter.department='';orgPage=1;render();return}
  if(ev.target.matches('[data-org-size]')){orgPageSize=Number(ev.target.value);orgPage=1;render();return}
  if(ev.target.matches('[data-org-login="platform"]')){modal={type:'org-login',id:ev.target.value};render()}
});
document.addEventListener('input',ev=>{if(ev.target.matches('[data-org-filter="keyword"]')){orgFilter.keyword=ev.target.value;orgPage=1;const field=ev.target;const start=field.selectionStart;render();const next=document.querySelector('[data-org-filter="keyword"]');next?.focus();next?.setSelectionRange(start,start)}});
