-- V14：新增 10 个热门城市的 50 个精选景点。
-- 景点坐标来自百度地点检索 API 返回的 GCJ-02 主 POI location，图片来自 Wikimedia Commons。
-- 主键沿用项目现有的小整数方案，固定写入 SQL，保证迁移可复现。

-- 北京市（city_id = 3）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(301, 3, '故宫博物院', 'history', 116.397047, 39.917752, '北京市东城区景山前街4号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Forbidden%20City%2C%20Beijing.jpg', '明清两代皇宫建筑群，是了解中国古代宫廷文化的北京必游地。', '故宫以完整宫殿格局、珍贵文物与历史故事构成丰富游览体验。', '地标性与文化含量都很高，适合首次到北京的游客。', '建议提前预约，从午门进入后按中轴线游览，并为专题展馆预留时间。', '开放时间随季节调整，周一通常闭馆', '需实名预约购票，以官方当日公告为准', 240, '上午', 4.9, 100, '首次到访者、历史文化爱好者、亲子家庭', 0, 1, 0, 1, 1, 1, 1, 1, NOW(), NOW()),
(302, 3, '天坛公园', 'history', 116.410832, 39.881942, '北京市东城区天坛东里甲1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Temple%20Of%20Heaven.jpg', '以祈年殿和圜丘为核心的明清皇家祭祀建筑群。', '天坛将建筑、园林和古代礼制融为一体，空间开阔，四季皆适合漫步。', '具有高辨识度的北京古建筑景观，适合摄影和文化游览。', '建议从东门入园，串联祈年殿、皇穹宇和圜丘，清晨人流相对较少。', '公园开放时间较长，景点时间随季节调整', '公园与联票价格不同，以官方当日公告为准', 150, '清晨或傍晚', 4.8, 96, '首次到访者、摄影爱好者、亲子家庭', 0, 0, 0, 0, 1, 1, 2, 1, NOW(), NOW()),
(303, 3, '颐和园', 'history', 116.274190, 39.998229, '北京市海淀区新建宫门路19号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Beijing%20China%20Summer-Palace-02.jpg', '以昆明湖、万寿山和长廊著称的大型皇家园林。', '园内湖山格局与古建筑群相互映衬，适合安排半日至一日游览。', '集中展示北方皇家园林美学，湖景和建筑摄影体验突出。', '可从东宫门入园，沿长廊至佛香阁，再视体力选择环湖或乘船。', '开放时间随淡旺季调整', '需购票，园中园可能另行收费，以官方公告为准', 240, '春秋季上午', 4.8, 95, '园林爱好者、摄影用户、亲子家庭', 0, 0, 0, 0, 0, 1, 3, 1, NOW(), NOW()),
(304, 3, '八达岭长城', 'history', 116.022765, 40.352331, '北京市延庆区G6京藏高速58号出口', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Badaling%20Great%20Wall%20%283019964222%29.jpg', '明长城中开放成熟、交通相对便利的代表性段落。', '八达岭地势险要，城墙依山势起伏，能直观感受长城的工程规模。', '北京郊区最具代表性的世界文化遗产点位。', '建议避开节假日高峰，根据体力选择北线徒步或缆车，注意防风防滑。', '开放时间随季节和天气调整', '需预约购票，缆车另行收费，以官方公告为准', 240, '春秋季早上', 4.8, 97, '首次到访者、户外爱好者、摄影用户', 0, 0, 0, 0, 0, 1, 4, 1, NOW(), NOW()),
(305, 3, '中国国家博物馆', 'museum', 116.401387, 39.905413, '北京市东城区东长安街16号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/National%20Museum%20of%20China%20%2854137045840%29.jpg', '以中国历史与艺术收藏为核心的国家级综合博物馆。', '馆藏时间跨度大，常设展和临时展适合用半天建立中国历史脉络。', '位于天安门广场东侧，适合与中轴线景点组合安排。', '建议提前预约，优先观看古代中国基本陈列，预留安检和存包时间。', '周一通常闭馆，其余日期以预约时段为准', '基本陈列通常免费预约，特展以官方公告为准', 240, '上午', 4.8, 95, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 1, 5, 1, NOW(), NOW());

-- 上海市（city_id = 5）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(306, 5, '外滩', 'landmark', 121.492712, 31.232884, '上海市黄浦区中山东一路北至外白渡桥、南至十六铺码头', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/2010%20Shanghai%20Bund%2C%20Viewed%20from%20Oriental%20Pearl%20Tower%2001.jpg', '沿黄浦江展开的城市滨水地标，一侧是历史建筑，一侧是陆家嘴天际线。', '外滩汇集多国历史建筑与现代城市景观，白天与夜晚各有不同观赏重点。', '步行门槛低、城市辨识度高，是首次到上海的必游地。', '建议从外白渡桥向南漫步，日落前抵达观景平台，避开节假日高峰人流。', '全天开放', '免费', 120, '傍晚至夜间', 4.9, 99, '首次到访者、情侣、摄影用户', 1, 0, 1, 0, 1, 1, 1, 1, NOW(), NOW()),
(307, 5, '东方明珠广播电视塔', 'landmark', 121.499659, 31.239860, '上海市浦东新区世纪大道1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Oriental%20Pearl%20Tower%20in%20Shanghai.jpg', '陆家嘴标志性高塔，可俯瞰黄浦江两岸城市景观。', '观光层、城市历史展陈与夜景共同构成浦东地标体验。', '适合从高处理解上海城市格局，与外滩对望体验互补。', '建议提前购票并关注天气，傍晚登塔可同时观看日落和夜景。', '开放时间以官方当日公告为准', '不同观光组合票价不同，以官方公告为准', 150, '傍晚', 4.7, 94, '首次到访者、亲子家庭、夜游用户', 0, 1, 1, 1, 1, 1, 2, 1, NOW(), NOW()),
(308, 5, '豫园', 'history', 121.492360, 31.227077, '上海市黄浦区福佑路168号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shanghai%20-%20Yu%20Garden%20-%200034.jpg', '上海老城厢中保存完好的江南古典园林。', '园内假山、池水、楼阁和回廊空间紧凑，周边可衔接城隍庙商圈。', '在现代都市中集中体验传统江南园林与老城商业氛围。', '建议开园后较早入园，避开中午团队高峰，游览后可步行至外滩。', '开放时间随季节调整', '需购票，以官方当日公告为准', 120, '上午', 4.7, 91, '园林爱好者、摄影用户、首次到访者', 0, 0, 0, 0, 1, 1, 3, 1, NOW(), NOW()),
(309, 5, '上海博物馆东馆', 'museum', 121.538806, 31.220466, '上海市浦东新区世纪大道1952号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shanghai%20Museum%20East.jpg', '以中国古代艺术为主题的大型博物馆新馆。', '东馆展陈空间宽敞，青铜、书法、绘画、雕塑等专题适合深度观展。', '馆藏质量高且雨天友好，适合与陆家嘴区域安排在同一天。', '建议提前预约，根据兴趣选择两至三个专题馆，避免一次浏览过多造成疲劳。', '周一通常闭馆，开放时间以预约页为准', '基本陈列通常免费预约，特展以官方公告为准', 180, '上午或雨天', 4.8, 92, '艺术爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 0, 4, 1, NOW(), NOW()),
(310, 5, '上海迪士尼度假区', 'family', 121.664681, 31.139667, '上海市浦东新区川沙新镇黄赵路310号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shanghai%20Disneyland%20Park%20Main%20Entry.jpg', '集主题乐园、演艺、巡游和夜间烟花于一体的大型度假区。', '园区适合全日游玩，热门项目、角色互动与夜间演出是核心体验。', '亲子和主题乐园用户的上海代表性目的地。', '建议提前购票并下载官方应用，开园前抵达，按实时排队时间安排项目。', '营业时间每日可能不同', '需购票，票价按日期分级，以官方公告为准', 600, '工作日全天', 4.8, 98, '亲子家庭、情侣、主题乐园爱好者', 0, 0, 1, 0, 1, 1, 5, 1, NOW(), NOW());

-- 重庆市（city_id = 6）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(311, 6, '洪崖洞民俗风貌区', 'night', 106.577979, 29.562164, '重庆市渝中区嘉陵江滨江路88号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hongyadong%20in%20Chongqing.jpg', '依山临江的吊脚楼风貌区，是重庆夜景代表性地标。', '多层建筑、山城步道和江岸夜景构成立体游览体验。', '夜游氛围强，适合首次到重庆的游客。', '建议日落前抵达，先从千厮门大桥或江北嘴观看全景，再步行进入街区。', '全天开放，商户营业时间各不相同', '免费', 150, '傍晚至夜间', 4.8, 99, '首次到访者、摄影用户、夜游用户', 1, 0, 1, 0, 1, 1, 1, 1, NOW(), NOW()),
(312, 6, '长江索道', 'landmark', 106.582784, 29.558440, '重庆市渝中区新华路索道北站', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E9%87%8D%E5%BA%86%E9%95%BF%E6%B1%9F%E7%B4%A2%E9%81%93%20-%20Chongqing%20Yangtze%20River%20Cableway%20-%202015.04%20-%20panoramio.jpg', '跨越长江的城市索道，可从空中观看山城与江景。', '索道原是居民交通工具，如今成为感受重庆立体地形的经典项目。', '体验时间不长，可与解放碑、洪崖洞串联。', '建议错峰购票，根据排队情况选择单程，雨雾天能见度较低时谨慎安排。', '营业时间以官方当日公告为准', '需购票', 60, '上午或傍晚', 4.7, 94, '首次到访者、情侣、摄影用户', 0, 0, 0, 0, 1, 1, 2, 1, NOW(), NOW()),
(313, 6, '磁器口古镇', 'history', 106.450203, 29.580604, '重庆市沙坪坝区磁南街1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E9%87%8D%E5%BA%86%E7%A3%81%E5%99%A8%E5%8F%A3.jpg', '保留川渝传统街巷格局的嘉陵江畔古镇。', '石板路、老建筑和小吃商铺共同呈现山城旧时生活氛围。', '适合半日慢逛，能兼顾老街摄影和地方小吃。', '主街人流较大，建议工作日上午到访，并适当进入支巷游览。', '全天开放', '免费', 150, '上午或傍晚', 4.6, 90, '美食爱好者、摄影用户、家庭游客', 1, 0, 0, 0, 1, 0, 3, 1, NOW(), NOW()),
(314, 6, '重庆中国三峡博物馆', 'museum', 106.550445, 29.562063, '重庆市渝中区人民路236号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chongqing%20Three%20Gorges%20Museum%20China.JPG', '系统展示三峡历史、巴渝文化和重庆城市变迁的综合博物馆。', '展览涵盖自然、考古、民俗和近现代史，适合建立对重庆的整体认识。', '室内、免费且信息量大，适合雨天和亲子游览。', '建议提前预约，优先观看三峡壮丽和远古巴渝等基本陈列。', '周一通常闭馆', '基本陈列通常免费预约', 180, '上午或雨天', 4.7, 89, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 0, 4, 1, NOW(), NOW()),
(315, 6, '李子坝单轨穿楼观景平台', 'landmark', 106.537913, 29.553623, '重庆市渝中区李子坝正街62号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Liziba%20Station%20with%2002031%20%2820191224152311%29.jpg', '近距离观看单轨列车穿楼而过的山城交通景观。', '观景平台与李子坝站隔街相望，集中展现重庆立体交通特色。', '停留时间短且辨识度高，适合纳入城市漫步路线。', '可乘单轨至李子坝站后下楼到观景平台，拍摄时不要进入车行道。', '全天开放', '免费', 45, '白天', 4.6, 92, '首次到访者、摄影用户、城市交通爱好者', 1, 0, 0, 0, 1, 1, 5, 1, NOW(), NOW());

-- 杭州市（city_id = 14）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(316, 14, '西湖风景名胜区', 'nature', 120.121418, 30.222546, '浙江省杭州市西湖区西湖街道', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/West%20Lake%2C%20Hangzhou%20%28Nine-turn%20bridge%29.jpg', '以湖山景观和历史人文著称的杭州核心景区。', '西湖沿岸分布苏堤、断桥、曲院风荷等多个景观，适合步行、骑行或乘船。', '四季皆有景观变化，是初识杭州山水与城市气质的首选。', '不建议一次环湖走完，可根据季节选择白堤、苏堤或杨公堤一线深度游览。', '全天开放', '大部分公共区域免费，游船和部分景点另行收费', 240, '清晨或傍晚', 4.9, 99, '首次到访者、情侣、摄影用户', 1, 0, 1, 0, 1, 1, 1, 1, NOW(), NOW()),
(317, 14, '灵隐寺', 'history', 120.101684, 30.240983, '浙江省杭州市西湖区法云弄1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Lingyin%20Temple%20in%20Hangzhou.jpg', '坐落于飞来峰山麓的千年佛教寺院。', '寺院、石窟造像与山林环境相结合，氛围庄严幽静。', '历史、宗教艺术与自然环境兼具，适合安排半日。', '建议早上抵达，先游览飞来峰再入寺，周末注意交通管制与人流。', '开放时间以景区当日公告为准', '飞来峰景区与寺院可能分别收费', 180, '早上', 4.8, 96, '文化游客、摄影用户、安静漫步人群', 0, 0, 0, 0, 0, 1, 2, 1, NOW(), NOW()),
(318, 14, '西溪国家湿地公园', 'nature', 120.064921, 30.267233, '浙江省杭州市西湖区天目山路518号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Xixi%20Wetland%20Park%2C%20Hangzhou%2C%20China.jpg', '河港、池塘与林地交织的城市湿地景区。', '湿地以步道和水路串联多个入口与观景区，适合慢节奏游览。', '与西湖的开阔湖景不同，更适合体验湿地生态和安静氛围。', '园区较大，建议先确定入口和游船线路，雨天注意步道湿滑。', '开放时间随季节调整', '部分区域需购票，游船另行收费', 240, '春秋季上午', 4.7, 90, '自然爱好者、亲子家庭、摄影用户', 0, 0, 0, 0, 0, 0, 3, 1, NOW(), NOW()),
(319, 14, '拱宸桥', 'history', 120.138924, 30.318248, '浙江省杭州市拱墅区京杭大运河上', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E6%8B%B1%E5%AE%B8%E6%A9%8B%C2%B7%E6%B5%99%E6%B1%9F%E6%9D%AD%E5%B7%9E%C2%B7%EF%BC%88%E8%88%AA%E6%8B%8D%E8%87%AA%E6%9D%B1%E5%8D%97%E5%BE%80%E8%A5%BF%E5%8C%97%EF%BC%89.jpg', '横跨京杭大运河的古石拱桥，是杭州运河文化地标。', '桥梁、运河水岸和桥西历史街区可组成轻松的城市漫步线。', '免费、人流相对分散，适合了解西湖以外的杭州。', '建议与中国京杭大运河博物馆、桥西街区串联，傍晚沿河漫步。', '全天开放', '免费', 90, '傍晚', 4.6, 84, '城市漫步爱好者、摄影用户、历史爱好者', 1, 0, 1, 0, 1, 0, 4, 1, NOW(), NOW()),
(320, 14, '良渚博物院', 'museum', 120.028060, 30.377319, '浙江省杭州市余杭区美丽洲路1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Liangzhu%20Museum%2002%202013-10.JPG', '展示良渚文化与中华文明早期城市、水利和玉器成就的专题博物馆。', '建筑空间和展陈设计现代，可系统了解良渚古城遗址的价值。', '信息密度高且适合雨天，可与良渚古城遗址公园组合。', '建议提前预约，先看博物院再前往遗址公园，更容易理解现场格局。', '周一通常闭馆', '通常免费预约', 150, '上午或雨天', 4.7, 86, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 0, 0, 5, 1, NOW(), NOW());

-- 南京市（city_id = 13）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(321, 13, '中山陵', 'history', 118.855039, 32.055072, '南京市玄武区石象路钟山风景名胜区', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sun%20Yat-sen%20Mausoleum.jpg', '依钟山山势建设的近代纪念性建筑群。', '长阶、陵门和祭堂沿中轴线层层展开，兼具历史意义与山林景观。', '南京代表性人文地标，适合与明孝陵组成钟山一日线。', '建议早上抵达，穿舒适步行鞋，游览后按体力乘景区交通车前往其他点位。', '开放时间以景区公告为准', '通常免费预约', 150, '上午', 4.8, 97, '首次到访者、历史爱好者、家庭游客', 1, 0, 0, 0, 1, 1, 1, 1, NOW(), NOW()),
(322, 13, '南京博物院', 'museum', 118.825173, 32.040683, '江苏省南京市玄武区中山东路321号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nanjing%20Museum.jpg', '馆藏丰富的大型综合性博物馆，展陈覆盖历史、艺术和民国生活。', '历史馆、艺术馆、特展馆和民国馆可满足不同观展兴趣。', '馆藏密度高、雨天友好，是理解江苏历史文化的重要起点。', '提前预约，首访建议优先历史馆与民国馆，预留三小时以上。', '周一通常闭馆', '通常免费预约，特展以官方公告为准', 240, '上午或雨天', 4.9, 96, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 1, 2, 1, NOW(), NOW()),
(323, 13, '夫子庙秦淮风光带', 'night', 118.788893, 32.020933, '南京市秦淮区贡院西街53号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nanjing%20Confucius%20Temple.jpg', '以夫子庙、江南贡院和秦淮河夜景为核心的历史街区。', '古建筑、河道、商业街和地方小吃共同构成南京老城夜游体验。', '交通方便、夜景氛围强，适合作为一日行程收尾。', '傍晚到达，先步行游览夫子庙与老门东方向，再根据人流决定是否乘画舸。', '全天开放', '街区免费，展馆和游船另行收费', 180, '傍晚至夜间', 4.7, 94, '首次到访者、情侣、夜游用户', 1, 0, 1, 0, 1, 1, 3, 1, NOW(), NOW()),
(324, 13, '侵华日军南京大屠杀遇难同胞纪念馆', 'museum', 118.741812, 32.035553, '南京市建邺区水西门大街418号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nanjing%20Massacre%20Memorial%20Hall%2C%20outside%203.jpg', '以史料、文物和纪念空间记录南京大屠杀历史的专题纪念馆。', '展陈内容严肃，通过历史证据与纪念景观传达珍爱和平的主题。', '是了解南京近现代史无法回避的重要场所。', '提前预约并保持庄重，建议预留两小时，不将此处与高强度娱乐行程紧密衔接。', '周一通常闭馆', '通常免费预约', 150, '上午', 4.9, 93, '历史学习者、成年游客、家庭游客', 1, 1, 0, 1, 1, 1, 4, 1, NOW(), NOW()),
(325, 13, '明孝陵', 'history', 118.837924, 32.051875, '江苏省南京市玄武区钟山风景名胜区内', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Ming%20Xiaoling%20Mausoleum.jpg', '明朝开国皇帝陵寝，以石象路、神道和山林环境著称。', '陵寝建筑遗存与钟山植被相互融合，秋冬季景观尤其出色。', '历史价值和季节摄影体验兼具，适合钟山线深度游。', '建议从石象路方向进入，与美龄宫或中山陵合理分配体力。', '开放时间以景区公告为准', '需购票，可购买钟山景区联票', 180, '秋季清晨', 4.8, 92, '历史爱好者、摄影用户、户外漫步人群', 0, 0, 0, 0, 0, 1, 5, 1, NOW(), NOW());

-- 广州市（city_id = 22）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(326, 22, '广州塔', 'landmark', 113.324533, 23.106283, '广东省广州市海珠区阅江西路222号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Canton%20Tower.jpg', '位于珠江南岸的广州城市地标与高空观景塔。', '登塔可俯瞰珠江新城与海心沙，夜间灯光与沿江游览联动性强。', '辨识度高，适合首次来穗和夜景摄影用户。', '天气通透时登塔，可在傍晚进入同时观看白天、日落与夜景。', '开放时间以官方公告为准', '不同高度与项目组合票价不同', 150, '傍晚', 4.8, 98, '首次到访者、情侣、摄影用户', 0, 1, 1, 1, 1, 1, 1, 1, NOW(), NOW()),
(327, 22, '陈家祠', 'history', 113.245163, 23.126741, '广州市荔湾区恩龙里34号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Chen%20Clan%20Ancestral%20Hall.jpg', '集岭南建筑、木雕、石雕、砖雕和陶塑于一体的传统建筑群。', '建筑装饰信息量丰富，现为广东民间工艺博物馆。', '交通便利、岭南特色鲜明，适合文化和建筑摄影。', '建议预留两小时，从屋脊陶塑、屏门木雕和庭院格局三个角度观看。', '开放时间以官方公告为准', '需购票', 120, '上午', 4.8, 92, '建筑爱好者、摄影用户、家庭游客', 0, 1, 0, 1, 1, 1, 2, 1, NOW(), NOW()),
(328, 22, '沙面岛', 'history', 113.244699, 23.106809, '广东省广州市荔湾区沙面北街53至54号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Shamian%20Island%2C%20Guangzhou%20%285928583279%29.jpg', '珠江畔保留较多近代历史建筑的林荫小岛。', '岛上街道尺度舒适，欧式建筑、老树与沿江步道适合慢行。', '免费且适合摄影，可与永庆坊、荔枝湾串联。', '建议上午或傍晚到访，避免中午暴晒，不干扰居民和正常宗教活动。', '全天开放', '免费', 120, '上午或傍晚', 4.7, 90, '情侣、摄影用户、城市漫步爱好者', 1, 0, 0, 0, 1, 0, 3, 1, NOW(), NOW()),
(329, 22, '广东省博物馆', 'museum', 113.326436, 23.114747, '广州市天河区珠江东路2号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Guangdong%20Museum.jpg', '以广东历史、自然资源和艺术收藏为核心的省级综合博物馆。', '馆内常设展适合系统了解岭南历史文化与自然环境。', '位于珠江新城，适合雨天并可与广州塔串联。', '提前预约，先选择两个感兴趣的基本陈列，再视时间补充临时展。', '周一通常闭馆', '通常免费预约', 180, '下午或雨天', 4.7, 89, '亲子家庭、历史爱好者、雨天游客', 1, 1, 0, 1, 1, 0, 4, 1, NOW(), NOW()),
(330, 22, '广州市白云山风景名胜区', 'nature', 113.297266, 23.180536, '广东省广州市白云区广园中路801号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Baiyun%20Mountain%2CGuangzhou.jpg', '位于广州中心城区北部的山地风景区和城市观景地。', '登山步道、摩星岭和山林景观适合半日户外活动。', '离城区较近，可体验广州自然环境与城市全景。', '根据体力选择步行、观光车或索道，夏季建议清晨出发并做好防晒补水。', '开放时间以景区公告为准', '需购买景区门票，索道等项目另行收费', 240, '秋冬季清晨', 4.7, 88, '户外爱好者、亲子家庭、摄影用户', 0, 0, 0, 0, 0, 0, 5, 1, NOW(), NOW());

-- 长沙市（city_id = 21）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(331, 21, '岳麓山国家重点风景名胜区', 'nature', 112.936273, 28.183690, '湖南省长沙市岳麓区登高路58号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Yuelu%20Mountain.jpg', '融合山林、书院、古寺与近代历史遗迹的城市山地景区。', '岳麓书院、爱晚亭和山顶观景可组成人文与户外兼具的半日线。', '长沙代表性山水人文景点，秋季景观尤佳。', '可从东门或南门进入，根据体力选择步行或景区交通，与岳麓书院预留充足时间。', '全天开放，内部景点时间各不相同', '景区免费预约，部分内部景点另行收费', 240, '秋季上午', 4.8, 96, '首次到访者、户外爱好者、历史爱好者', 1, 0, 0, 0, 1, 1, 1, 1, NOW(), NOW()),
(332, 21, '橘子洲景区', 'landmark', 112.961998, 28.186938, '湖南省长沙市岳麓区橘子洲头2号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Orange%20Isle%2C%20Changsha.jpg', '位于湘江中的长型江心洲，是长沙城市景观与近代历史地标。', '洲上绿地、江景步道和橘子洲头雕像适合慢行游览。', '交通便利、城市辨识度高，可与岳麓山对岸联动。', '景区较长，建议乘观光车单程再步行返回，烟花活动期间关注交通管制。', '全天开放', '免费预约，观光车另行收费', 180, '傍晚', 4.8, 97, '首次到访者、家庭游客、摄影用户', 1, 0, 1, 0, 1, 1, 2, 1, NOW(), NOW()),
(333, 21, '湖南博物院', 'museum', 112.993462, 28.211889, '湖南省长沙市开福区东风路50号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Entrance%20of%20Hunan%20Museum%2C%202018-09-28.jpg', '以马王堆汉墓出土文物和湖湘历史艺术为核心的重要博物馆。', '基本陈列系统展示马王堆文物与湖南地方历史。', '馆藏独特、展陈成熟，是长沙文化游的优先选择。', '预约高峰较明显，建议提前锁定时段，先看马王堆展陈再补充其他展馆。', '周一通常闭馆', '基本陈列通常免费预约', 240, '上午或雨天', 4.9, 98, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 1, 3, 1, NOW(), NOW()),
(334, 21, '杜甫江阁', 'history', 112.968613, 28.184703, '湖南省长沙市天心区湘江中路108号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Changsha%20Dufu%20Pavilion.jpg', '湘江东岸的仿古楼阁，夜间灯光与橘子洲江景相互映衬。', '楼阁以杜甫与湖湘文化为主题，周边沿江步道适合夜游。', '位置紧邻市中心，是拍摄长沙江岸夜景的便利点位。', '建议日落后从太平老街或坡子街步行前往，登阁前关注当日开放情况。', '开放时间以官方公告为准', '外部免费，登阁可能收费', 90, '夜间', 4.6, 89, '夜游用户、情侣、摄影用户', 0, 0, 1, 0, 1, 0, 4, 1, NOW(), NOW()),
(335, 21, '太平老街', 'food', 112.971776, 28.192734, '湖南省长沙市天心区太平街', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Taiping%20Street%2C%20Changsha.jpg', '保留老长沙街巷尺度的历史商业街，集中展示小吃与城市夜生活。', '街区串联贾谊故居、老字号和多种湖南小吃。', '交通便利，适合作为长沙市中心美食漫步的起点。', '建议傍晚进入，小份分享多种小吃，节假日人流过大时可转向周边支巷。', '全天开放', '免费', 120, '傍晚至夜间', 4.6, 93, '美食爱好者、夜游用户、年轻游客', 1, 0, 1, 0, 1, 0, 5, 1, NOW(), NOW());

-- 武汉市（city_id = 20）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(336, 20, '黄鹤楼', 'history', 114.302410, 30.544758, '武汉市武昌区蛇山西山坡特1号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/20240621%20Yellow%20Crane%20Tower.jpg', '位于蛇山之巅的武汉历史文化地标，可俯瞰长江大桥与三镇风光。', '主楼、园林和诗词文化共同构成游览内容。', '辨识度高，是首次了解武汉江城格局的代表景点。', '建议上午或日落前登楼，游览后可步行前往户部巷或武昌江滩。', '开放时间以官方公告为准', '需购票', 150, '上午或傍晚', 4.8, 98, '首次到访者、历史爱好者、摄影用户', 0, 0, 0, 0, 1, 1, 1, 1, NOW(), NOW()),
(337, 20, '湖北省博物馆', 'museum', 114.365484, 30.561503, '武汉市武昌区东湖路160号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Hubei%20Provincial%20Museum.JPG', '以曾侯乙墓出土文物、越王勾践剑和荆楚文化为特色的综合博物馆。', '馆藏与音乐文物展陈独具特色，适合深入了解荆楚文明。', '馆藏含金量高且紧邻东湖，适合组合一日行程。', '提前预约，优先参观曾侯乙和越王勾践剑相关展厅，编钟演奏需单独关注场次。', '周一通常闭馆', '基本陈列通常免费预约', 240, '上午或雨天', 4.9, 96, '历史爱好者、亲子家庭、雨天游客', 1, 1, 0, 1, 1, 1, 2, 1, NOW(), NOW()),
(338, 20, '东湖生态旅游风景区', 'nature', 114.413264, 30.548676, '湖北省武汉市武昌区沿湖大道16号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Wuhan%20East%20Lake%2002.jpg', '规模广阔的城市湖泊风景区，绿道、磨山和听涛等片区各具特色。', '湖岸绿道适合骑行与漫步，樱花、荷花等季节景观明显。', '能体验武汉城市与大水面的关系，户外活动选择丰富。', '不建议一次游遍，根据季节在磨山、听涛或落雁中选择一个片区。', '全天开放', '大部分公共区域免费，部分景点另行收费', 240, '春秋季清晨', 4.8, 95, '户外爱好者、亲子家庭、摄影用户', 1, 0, 0, 0, 0, 1, 3, 1, NOW(), NOW()),
(339, 20, '武汉大学', 'history', 114.366263, 30.536522, '湖北省武汉市武昌区八一路299号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Whu%20old%20library%201.JPG', '依珞珈山建设的历史校园，老斋舍、老图书馆与樱花景观知名。', '校园融合近代建筑、山地空间和大学文化氛围。', '春季樱花和历史建筑摄影吸引力强。', '校园首先是教学场所，到访前必须确认对外开放与预约规则，不影响正常秩序。', '以学校当日管理公告为准', '通常免费，特殊时段需预约', 120, '樱花季上午', 4.7, 92, '建筑爱好者、摄影用户、校园漫步人群', 1, 0, 0, 0, 1, 0, 4, 1, NOW(), NOW()),
(340, 20, '江汉路步行街', 'business', 114.291077, 30.581148, '湖北省武汉市江岸区江汉路', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/%E6%B1%9F%E6%B1%89%E8%B7%AF%E6%AD%A5%E8%A1%8C%E8%A1%97.jpg', '汉口历史建筑、商业和街头生活集中的城市步行街。', '街区串联江汉关、租界建筑和汉口江滩，适合夜间漫步。', '交通便利、餐饮购物选择多，适合行程收尾。', '傍晚从江汉路向江汉关方向步行，再到汉口江滩看夜景。', '全天开放', '免费', 150, '傍晚至夜间', 4.6, 91, '美食爱好者、夜游用户、城市漫步爱好者', 1, 0, 1, 0, 1, 0, 5, 1, NOW(), NOW());

-- 厦门市（city_id = 40）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(341, 40, '鼓浪屿风景名胜区', 'history', 118.067043, 24.444697, '福建省厦门市思明区鼓浪屿', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Gulangyu%20Island.jpg', '以万国建筑、音乐文化和海岛步行体验著称的世界文化遗产。', '岛上无机动车，街巷、花园、老别墅与海岸景观适合慢步探索。', '是厦门最具代表性的景点，人文和海岛氛围兼具。', '必须提前确认游客航线与船票，岛上建议避开主商业街高峰，向内部支巷游览。', '全天开放，内部景点时间各不相同', '岛屿免费，往返船票和内部景点另行收费', 360, '上午至傍晚', 4.9, 99, '首次到访者、情侣、摄影用户', 1, 0, 1, 0, 0, 1, 1, 1, NOW(), NOW()),
(342, 40, '厦门园林植物园', 'nature', 118.109272, 24.447950, '福建省厦门市思明区虎园路25号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Xiamen%20Botanical%20Garden1.jpg', '依山建设的大型植物园，雨林世界和多肉植物区尤受欢迎。', '园区植物类型丰富，山地道路串联多个主题园。', '自然景观和摄影体验突出，亲子用户也容易安排。', '建议早上入园，先查看雨林喷雾时间，利用景交车节省山地步行体力。', '开放时间以官方公告为准', '需购票，景交车另行收费', 240, '清晨', 4.8, 93, '亲子家庭、摄影用户、自然爱好者', 0, 0, 0, 0, 0, 1, 2, 1, NOW(), NOW()),
(343, 40, '南普陀寺', 'history', 118.096732, 24.441413, '厦门市思明区思明南路515号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Nanputuo%20Temple%2C%20Xiamen.jpg', '位于五老峰下、厦门大学旁的闽南佛教寺院。', '寺院建筑、放生池和背后山林相互映衬，环境安静。', '交通便利且文化氛围浓厚，可与厦门大学周边串联。', '上午人流相对平稳，参观时遵守宗教场所礼仪，开放政策以现场为准。', '开放时间以寺院公告为准', '通常免费', 90, '上午', 4.7, 91, '文化游客、家庭游客、安静漫步人群', 1, 0, 0, 0, 1, 1, 3, 1, NOW(), NOW()),
(344, 40, '环岛路', 'nature', 118.083065, 24.441670, '福建省厦门市思明区环岛南路', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Huandao%20Rd.JPG', '沿厦门岛东南海岸展开的滨海道路与慢行景观带。', '沙滩、木栈道、自行车道和海景观景点适合自由组合。', '免费且适合骑行，能集中体验厦门滨海城市氛围。', '从曾厝垵、音乐广场或黄厝沙滩中选择一段，傍晚骑行并注意风力。', '全天开放', '免费', 180, '傍晚', 4.8, 94, '情侣、骑行爱好者、摄影用户', 1, 0, 1, 0, 0, 1, 4, 1, NOW(), NOW()),
(345, 40, '集美学村', 'history', 118.092797, 24.566515, '福建省厦门市集美区银江路183号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Jimei%20School%20Village.jpg', '以嘉庚建筑、校园与龙舟池景观为主的历史文化片区。', '中西合璧的嘉庚建筑分布在多所学校和纪念场所周边。', '比岛内热门景区更宽松，适合建筑摄影和慢行。', '从集美学村地铁站出发，串联龙舟池和鳌园，不进入未开放的教学区。', '公共区域全天开放', '公共区域免费，部分纪念场馆另行收费', 180, '上午或傍晚', 4.6, 87, '建筑爱好者、摄影用户、城市漫步人群', 1, 0, 0, 0, 1, 0, 5, 1, NOW(), NOW());

-- 青岛市（city_id = 41）
INSERT INTO spot (id, city_id, spot_name, spot_type, lng, lat, address, amap_poi_id, boundary_geojson, cover_url, summary, description, recommend_reason, travel_guide, opening_hours, ticket_info, suggested_duration, best_time, recommend_score, hot_score, suitable_crowd, is_free, is_indoor, is_night, is_rainy_day, subway_friendly, first_visit, sort_order, status, created_at, updated_at) VALUES
(346, 41, '栈桥景区', 'landmark', 120.318222, 36.061784, '青岛市市南区太平路12号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Qingdao%20Zhanqiao.jpg', '从老城海岸伸入青岛湾的标志性长堤，尽端为回澜阁。', '栈桥与周边历史城区、海湾景观关系紧密，适合海边漫步。', '交通便利、城市辨识度高，是首次到青岛的经典起点。', '早上或傍晚到访，关注风浪和潮汐，游览后可步行进入大鲍岛历史街区。', '全天开放，恶劣天气可能临时管控', '免费', 90, '清晨或傍晚', 4.7, 95, '首次到访者、摄影用户、家庭游客', 1, 0, 0, 0, 1, 1, 1, 1, NOW(), NOW()),
(347, 41, '八大关风景区', 'history', 120.350973, 36.053392, '山东省青岛市市南区武胜关支路10号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Badaguan%2C%20Qingdao.jpg', '以近代别墅建筑、林荫道路和海岸景观著称的历史街区。', '多国建筑风格与四季植被结合，花石楼、第二海水浴场等可串联游览。', '步行体验好、摄影题材丰富，适合慢逛。', '避免只走主路，可沿山海关路、居庸关路和武胜关路形成小环线。', '公共街区全天开放', '街区免费，部分建筑展馆另行收费', 180, '春秋季上午', 4.8, 93, '情侣、摄影用户、建筑爱好者', 1, 0, 0, 0, 1, 1, 2, 1, NOW(), NOW()),
(348, 41, '崂山风景区', 'nature', 120.598923, 36.192605, '山东省青岛市崂山区崂山景区专用路', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Laoshan.jpg', '黄海之滨以花岗岩峰林、道教文化和山海景观著称的山岳景区。', '崂山包含多条独立游览线路，仰口、太清和巨峰体验不同。', '山海结合的景观稀缺，适合安排一整天户外行程。', '出发前必须选定单一游览区和入口，不将不同线路当作一个步行环线。', '开放时间随季节和天气调整', '需购票，各游览区票务和交通政策不同', 420, '春秋季全天', 4.8, 96, '户外爱好者、摄影用户、文化游客', 0, 0, 0, 0, 0, 1, 3, 1, NOW(), NOW()),
(349, 41, '青岛啤酒博物馆', 'museum', 120.347241, 36.079354, '青岛市市北区登州路56号', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Tsingtao%20Brewery%20Museum%2020091001.jpg', '依托早期啤酒厂房展示青岛啤酒历史、工艺与工业遗产的专题博物馆。', '展览将历史资料、生产线和品饮体验结合。', '主题鲜明且雨天友好，适合了解青岛城市工业与啤酒文化。', '建议预留两小时，品饮后不驾车，可与登州路周边餐饮组合。', '开放时间以官方公告为准', '需购票', 120, '下午或雨天', 4.7, 90, '成年游客、工业遗产爱好者、雨天游客', 0, 1, 0, 1, 1, 0, 4, 1, NOW(), NOW()),
(350, 41, '五四广场', 'landmark', 120.384504, 36.062800, '山东省青岛市市南区东海西路青岛市政府对面', NULL, NULL, 'https://commons.wikimedia.org/wiki/Special:Redirect/file/May%20Fourth%20Square.jpg', '以五月的风雕塑和浮山湾海岸线为核心的城市广场。', '广场与奥帆中心、情人坝和海滨步道可形成连续夜游路线。', '免费、交通便利，适合观看青岛现代城市夜景。', '建议日落前抵达，沿海向奥帆中心步行，灯光秀时间以当日公告为准。', '全天开放', '免费', 120, '傍晚至夜间', 4.7, 92, '首次到访者、情侣、夜游用户', 1, 0, 1, 0, 1, 1, 5, 1, NOW(), NOW());

-- 每个景点关联 2 个核心标签；关系主键沿用现有小整数方案。
INSERT INTO spot_tag_relation (id, spot_id, tag_id, created_at) VALUES
(37, 301, 1, NOW()), (38, 301, 7, NOW()),
(39, 302, 1, NOW()), (40, 302, 2, NOW()),
(41, 303, 1, NOW()), (42, 303, 2, NOW()),
(43, 304, 1, NOW()), (44, 304, 9, NOW()),
(45, 305, 7, NOW()), (46, 305, 8, NOW()),
(47, 306, 1, NOW()), (48, 306, 3, NOW()),
(49, 307, 1, NOW()), (50, 307, 3, NOW()),
(51, 308, 1, NOW()), (52, 308, 2, NOW()),
(53, 309, 7, NOW()), (54, 309, 8, NOW()),
(55, 310, 4, NOW()), (56, 310, 5, NOW()),
(57, 311, 1, NOW()), (58, 311, 3, NOW()),
(59, 312, 1, NOW()), (60, 312, 2, NOW()),
(61, 313, 6, NOW()), (62, 313, 2, NOW()),
(63, 314, 7, NOW()), (64, 314, 8, NOW()),
(65, 315, 1, NOW()), (66, 315, 6, NOW()),
(67, 316, 1, NOW()), (68, 316, 2, NOW()),
(69, 317, 1, NOW()), (70, 317, 9, NOW()),
(71, 318, 4, NOW()), (72, 318, 9, NOW()),
(73, 319, 6, NOW()), (74, 319, 2, NOW()),
(75, 320, 7, NOW()), (76, 320, 8, NOW()),
(77, 321, 1, NOW()), (78, 321, 9, NOW()),
(79, 322, 7, NOW()), (80, 322, 8, NOW()),
(81, 323, 1, NOW()), (82, 323, 3, NOW()),
(83, 324, 7, NOW()), (84, 324, 8, NOW()),
(85, 325, 2, NOW()), (86, 325, 9, NOW()),
(87, 326, 1, NOW()), (88, 326, 3, NOW()),
(89, 327, 1, NOW()), (90, 327, 7, NOW()),
(91, 328, 6, NOW()), (92, 328, 2, NOW()),
(93, 329, 7, NOW()), (94, 329, 8, NOW()),
(95, 330, 4, NOW()), (96, 330, 9, NOW()),
(97, 331, 1, NOW()), (98, 331, 9, NOW()),
(99, 332, 1, NOW()), (100, 332, 6, NOW()),
(101, 333, 7, NOW()), (102, 333, 8, NOW()),
(103, 334, 3, NOW()), (104, 334, 2, NOW()),
(105, 335, 3, NOW()), (106, 335, 6, NOW()),
(107, 336, 1, NOW()), (108, 336, 2, NOW()),
(109, 337, 7, NOW()), (110, 337, 8, NOW()),
(111, 338, 4, NOW()), (112, 338, 9, NOW()),
(113, 339, 6, NOW()), (114, 339, 2, NOW()),
(115, 340, 3, NOW()), (116, 340, 6, NOW()),
(117, 341, 1, NOW()), (118, 341, 5, NOW()),
(119, 342, 4, NOW()), (120, 342, 2, NOW()),
(121, 343, 6, NOW()), (122, 343, 1, NOW()),
(123, 344, 5, NOW()), (124, 344, 6, NOW()),
(125, 345, 6, NOW()), (126, 345, 2, NOW()),
(127, 346, 1, NOW()), (128, 346, 2, NOW()),
(129, 347, 2, NOW()), (130, 347, 5, NOW()),
(131, 348, 1, NOW()), (132, 348, 9, NOW()),
(133, 349, 7, NOW()), (134, 349, 8, NOW()),
(135, 350, 1, NOW()), (136, 350, 3, NOW());
