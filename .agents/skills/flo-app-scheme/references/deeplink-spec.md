# FLO Music

스킴 : flomusic://{path}

> ⚠️ URL의 모든 parameter 값은 URL인코딩해야 합니다. 문자열 더하기 등으로 직접 URL을 만드는 경우 꼭 인코딩 해주세요.

## IOS Universal Link 규격

- https://web.music-flo.com/linker?flo_scheme={ UTF8(FLO SCHEME) }
- ex) https://web.music-flo.com/linker?flo_scheme=flomusic%3A%2F%2Fview%2FvideoMainPlayer%3Fid%3D400018602

## DeepLink

> ℹ️ DeepLink는 외부에서 호출하거나 Push Notification의 url로 사용가능합니다.

> ℹ️ 앱내 배너나 웹뷰에서도 호출할 수 있습니다.

> ℹ️ 파라미터에 clearChildScreen = {true | false} 를 추가 하면 모든 화면을 닫고 해당 Scheme을 처리합니다.

## 공통 Parameter

- 비개발자를 위한 minAppVer, from 작성 요령
  - minAppVer, from을 붙일때 앞부분에 ?가 있다면 &를 붙임, ?가 없으면 ?로 붙임
    - ex) flomusic://view/my**?**minAppVer=1.0.0**&**from=MMS
    - ex) flomusic://view/my**?**tab=RECENT**&**minAppVer=1.0.0**&**from=MMS

- **minAppVer** : ex) flomusic://view/my?**minAppVer=1.0.0**
  - 현재 클라이언트 버전이 minAppVer보다 작을 경우 DeepLink를 무시하고 alert을 띄운다.
  - if 현재 버전 < minAppVer then alert("선택한 기능을 실행하려면 최신버전의 앱이 필요해요.", "닫기/업데이트")
  - 지원버전 : FLO 4.9.0이상

- **refer** : ex) flomusic://view/my?**from=xxxx**
  - deeplink로 앱 실행 시 ActionLog에 인입로그를 적재하고, body값에 from를 추가하여 등록한다. (인입경로 확인을 위해)
  - 단점 : 운영 단계에서 refer를 입력해야하며, 운영자에 의한 로그 정합성이 떨어질 수 있다.
  - 운영요건 : 공백없는, 특수문자 없는 영문과 숫자 (SpaceBar, \_, - 등은 특수문자이니 사용하지 말것.)
  - 지원버전 : FLO 6.5.0 이상

## AppScheme (Music)

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| (없음) | 앱을 foreground로 | `flomusic://` | 예정 | 예정 |

### view

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/home** | 홈 화면. 이용권 결제 후 음악듣기 버튼 선택시 홈화면으로 이동. 홈 화면 새로고침 진입 후 앵커 이동. anchorType: type에 해당하는 섹션으로 앵커이동. personalType: anchorType이 PERSONAL인 경우 상단패널 타입별 패널이동. bannerIndex: anchorType이 BANNER(하단 배너), BAND(중단 배너)인 경우 해당 banner index로 이동 (0-indexing) | `flomusic://view/home`, `flomusic://view/home?anchorType=NEW`, `flomusic://view/home?anchorType=BAND&bannerIndex=0`, `flomusic://view/home?anchorType=PERSONAL&personalType=PRI_LIVE_CHART` | 3.0 | 3.0 |

**anchorType 타입별 정리:**

| anchorType | 설명 |
| --- | --- |
| PERSONAL | 상단패널 |
| WELCOME_MSG | 환영메시지 |
| ONE_SEED_TRACK | 빠른선곡 |
| BAND | 중단배너 |
| NEW | 오늘 발매 음악 |
| RECOMMEND_FAVORITE_ALBUM | 좋아할만한 최신앨범 |
| RECOMMEND_FAVORITE_ARTIST1, RECOMMEND_FAVORITE_ARTIST2 | {아티스트명}좋아한다면 |
| RCMMD_TRACK | 나를 위한 새로운 발견 |
| PREFER_SIMILAR_TRACK | 오늘의 추천 |
| ARTIST_POPULAR_TRACK | 아티스트 MIX |
| TRY_RECOMMEND | 첫 14일의 추천 |
| RECOMMEND_FAVORITE_GENRE | {장르명} 외 좋아할만한 |
| ARTIST1 | 000 그리고 들어볼만한 아티스트 |
| EDITOR | 에디터스 픽 |
| BANNER | 하단배너 |

**personalType 타입별 정리:**

| personalType | 설명 |
| --- | --- |
| PREFER_SIMILAR_TRACK | 데일리 추천 |
| PLAY_NOW | 빠른 재생 |
| RCMMD_LIKE_TRACK | 방금레이더 |
| BEGINNER_TRACK | 첫 14일의 추천 |
| RCMMD_TRACK | 나새발 (장르명 새로운 발견) |
| ARTIST_POPULAR_TRACK | 아티스트믹스 |
| CABINET_TRACK | 보관함 추천 |
| PRI_LIVE_CHART | FLO 차트 |
| PRI_KIDS_CHART | 키즈 차트 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/browser** | 둘러보기 화면. 앱 실행 후 둘러보기 화면으로 바로 이동 | `flomusic://view/browser` | 4.7 | 4.7 |
| **view/my** | 보관함 화면. 앱 실행 후 마이페이지로 바로 이동 | `flomusic://view/my` | 4.7 | 4.7 |
| view/my?tab={name} | 보관함에서 특정 Tab 화면. 로그아웃 및 오프라인 시 탭이 없을 경우 "저장한 곡"(기본탭)으로 이동 | `flomusic://view/my?tab=mostListened` | 5.1.0 | 5.1.0 |

**tab Name 정의:**

| name | 설명 |
| --- | --- |
| myPlaylist | 내 리스트 |
| like | 좋아요 |
| downloadTracks | 저장한 곡 |
| mostListened | 많이 들은 |
| recent | 최근 감상 |
| localTracks | 로컬음악/음악파일 |

**tab type 정의 (view/my?tab={tab}&type={type})** (v7.2~):

| tab | type |
| --- | --- |
| following | creator |
| like | track, album, video, artist, theme |
| recent | track, theme, video |

**tab periodValue 정의 (view/my?tab=mostListened&periodValue={periodValue})** (v8.7~):

| periodValue | 설명 |
| --- | --- |
| all | 전체 |
| 6months | 6개월 |
| YYYYMM (ex: 202507) | 해당 연월 |

> tab이 mostListened인 경우만 사용가능. 처리할 수 없는 값이 들어오면 periodValue를 전달받지 않은것으로 처리됨.

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/purchase/recommend** | 이용권 구매/추천 (AOS only) | - | 4.0 | X |
| **view/purchase/voucher** | 이용권 구매/이용권 | - | 4.0 | 4.0 |
| **view/purchase/artist** | 이용권 구매/Artist& | - | 5.1 | - |
| **view/purchase/skt** | 이용권 구매/T혜택관 | - | 4.0 | 4.0 |
| **view/purchase/affiliate** | 이용권 구매/제휴 | - | 5.1 | - |
| **view/purchase/coupon** | 이용권 구매/쿠폰등록 | - | 5.1 | - |
| **view/purchase/my** | 이용권 구매/내 이용권 | - | 4.0 | 4.0 |
| ?clearChildScreen={true\|false} | true이면, 하위화면을 모두 닫고 홈화면에서 해당 화면으로 이동. 파라미터가 없을 경우 default값은 false | - | 4.8 | 4.8 |
| **view/pass** ?passId={passId}&url={url} | passId 이용권 구매 페이지 호출 (AOS only). 로그인이나 이용권 종류에 따라 에러가 발생할 수 있음. 실제 호출되는 web url에는 mode=webview&osType=A&token=xxx&paymentToken=xxx가 추가됨. | `flomusic://view/pass?passId=7200` | 3.5 | 3.4 |
| &title={string} | 결제 페이지 타이틀. 지정하지 않으면 기본값("이용권 구매")을 사용함. | - | 4.0 | 4.0 |
| **view/login** | 로그인 화면. 로그인 후, 로그인 페이지 링크로 이동시, 회원정보수정 페이지로 랜딩 | `flomusic://view/login` | 3.1 | 3.1 |
| **view/signUp** | 회원가입 화면 | `flomusic://view/signUp` | 3.4 | 3.4 |
| **view/signUp/changeIDUser** | 아이디회원으로 전환 팝업 | `flomusic://view/signUp/changeIDUser` | 3.4 | 3.4 |
| **view/content** ?type={contentType}&id={contentId}&autoPlay={true\|false}&moveSkip={true\|false} | 상세화면 이동 | `flomusic://view/content?type=CHART&id=100` | 4.0 | 4.0 |

**contentType 정의:**

| type | 설명 |
| --- | --- |
| CHNL | 일반 채널 |
| ALBUM | 앨범 |
| ARTIST | 아티스트 |
| MY_CHNL | 마이 채널 |
| CHART | 차트 |
| RC_ATST_TR | 추천: 선호/유사 아티스트 인기곡 |
| RC_SML_TR | 추천: 유사곡 |
| RC_GR_TR | 추천: 선호 장르 유사곡 |
| RC_CF_TR | 추천: CF 추천 알고리즘 |
| RC_LTMM_TR | 나의 RE;CORD (v8.1~) |
| TRACK | 곡 상세 |
| GENRE | 장르 상세 |
| SITTN | 상황별 |
| MOOD | 분위기별 |
| CREATOR_PLAYLIST | 크리에이터 플레이리스트 (v6.0~) |
| PLAYLIST | 플레이리스트 |
| CREATOR | 크리에이터 상세 (v6.1~) |
| PRI_PLAYLIST | AI 추천 플레이리스트 - GPT |

**view/content 추가 파라미터:**

- **id**: 각 타입별 content id (필수값이며, 간혹 id가 필요없는 화면일 경우 id=0을 셋팅해서 보내줘야 합니다.)
  - SITTN, MOOD, CREATOR_PLAYLIST의 경우 0이면 shortcut list 화면으로 이동
- **autoPlay**: 해당 컨텐츠 재생. 전체 재생이 가능하면 전체 재생. TRACK인 경우 곡 재생. GENRE, SITTN, MOOD, CREATOR는 불가능
- **moveSkip**: autoPlay옵션과 함께 사용되는 옵션. 지정된 화면으로 이동 할지를 결정함. ex) autoPlay=true&moveSkip=true이면 화면은 이동하지 않고, 음원만 재생됨. default는 false (FLO v6.0~)
- CREATOR를 받은 시점에 "로그인 상태"라면 "캐릭터 넘버"와 id를 비교하여 같다면 "나의 크리에이터 상세"로 이동한다.

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/comment** ?id={contentId}&type={contentType}&name={contentName}&commentId={commentId}&parentCommentId={parentCommentId}&replyCommentId={replyCommentId} | 댓글 상세 페이지 이동 및 댓글, 답글 아이디가 있을 경우 해당 댓글, 답글로 앵커 이동 | `flomusic://view/comment?id=26629&type=CHNL&name=All%20that%20Jazz..&commentId=1643297327010008` | 6.5 | 6.5 |

**view/comment contentType:**

| type | 설명 |
| --- | --- |
| CHNL | 일반 채널 |
| PLAYLIST | 공개 플레이리스트 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/content/recommend** ?autoplay={true\|false} | 추천 음악 상세 화면 보기 for widget (AOS only). 홈 추천 패널에 노출된 일반 채널중 첫번째 채널의 상세 화면으로 이동. 없으면 실시간 차트. | - | 4.5 | X |
| **view/content/v2** ?type={contentType}&id={contentId}&autoPlay={true\|false} | id: 암호화된 content id | - | 4.2 | 4.2 |
| **view/notification** ?tab={tabName} | 알림함 페이지 이동 및 특정 탭 선택 | `flomusic://view/notification?tab=ALL` | 6.5 | 6.5 |

**notification tab 정의:**

| tabName | 설명 |
| --- | --- |
| ALL | 전체 |
| RECOMMEND | 추천 |
| EVENT | 이벤트 |
| ACTIVITY | 활동 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/browser** ?anchorType={contentType} | 둘러보기 화면 전환 후 앵커 이동 | `flomusic://view/browser?anchorType=RANK_CHART` | 6.4 | 6.2 |

**browser anchorType:**

| anchorType | 설명 |
| --- | --- |
| RANK_CHART | 차트 |
| GENRE | 장르 |
| SITTN | 상황 |
| MOOD | 분위기 |
| RECOMMENDATION | 영상 |
| CREATOR_PLAYLIST | 크리에이터 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/popularchart** ?id={chartId}&showTab={true\|false} | 둘러보기 > 차트 상세 이동. id: chart ID에 해당하는 페이지로 이동. chart ID가 없으면 첫번째 차트로 이동. showTab: 탭 영역 노출/비노출 | `flomusic://view/popularchart?id=100&showTab=false` | 6.2 | 6.2 |
| **view/notice** | 공지사항 목록 | `flomusic://view/notice` | 3.4 | 3.4 |
| **view/notice** ?itemId={itemId} | 공지사항 목록 - 항목 내용 보기. 해당 항목을 펼치고 스크롤이 필요한 경우 스크롤. | `flomusic://view/notice?itemId=50` | 3.4 | 3.4 |
| **view/support** | 고객센터 | `flomusic://view/support` | 3.2 | 3.4 |
| **view/support/qna/write** ?inquiryType={type}&inquiryContent={String} | 고객센터/1:1문의 및 내역 확인 - 1:1 문의하기 탭 | `flomusic://view/support/qna/write?inquiryType=SOUNDTRACK` | 3.2 | 3.2 |

**inquiryType (v7.9):** `SKT | PAYMENT | BUG | SERVICE | EVENT | SOUNDTRACK | FLO_STUDIO | ETC`

**inquiryContent (v7.9):** String 형태로 제공, UTF-8 인코딩 되어 전달 되어야 함.

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/support/qna/mylist** | 고객센터/1:1문의 및 내역 확인 - 나의 문의 내역 탭 | `flomusic://view/support/qna/mylist` | 3.2 | 3.2 |
| **view/support/faq** | FAQ 목록 | `flomusic://view/support/faq` | 3.4 | 3.4 |
| **view/support/faq** ?itemId={itemId} | FAQ 목록 - 항목 내용 보기 | `flomusic://view/support/faq?itemId=1` | 3.4 | 예정 |
| **view/setting** | 설정 | `flomusic://view/setting` | 7.5 | 7.5 |
| **view/sleepModeSetting** | 잠자기 모드 | `flomusic://view/sleepModeSetting` | 8.1 | 8.1 |
| **view/soundSetting** ?type={soundEffect\|soundQuality} | 음향/음질 설정 화면. type: soundEffect(음향 설정탭), soundQuality(음질 설정탭) | `flomusic://view/soundSetting?type=soundEffect` | 8.1 | 8.1 |
| **view/eqSetting** | 이퀄라이저 설정 화면 | `flomusic://view/eqSetting` | 8.1 | 8.1 |
| **view/downloadPlaylist** | 음악 재생목록 불러오기 화면 | `flomusic://view/downloadPlaylist` | 8.1 | 8.1 |
| **view/addPlaylistSetting** | 음악 재생목록 담기 설정 화면 | `flomusic://view/addPlaylistSetting` | 8.1 | 8.1 |
| **view/playerSetting** | 재생 설정 화면 | `flomusic://view/playerSetting` | 8.1 | 8.1 |
| **view/customizePlayerSetting** | 나만의 플레이어 꾸미기 화면 | `flomusic://view/customizePlayerSetting` | 8.1 | 8.1 |
| **view/fullWeb** ?url={url}&titleBar={static\|auto\|none}&title={string} | 전체화면 웹뷰 (새창으로 띄움). url: 불러올 웹 URL. 실제 호출 url에는 osType={A\|I}&accessToken={token}이 추가됨. titleBar: static(기본값), auto(<title> 사용), none(타이틀바 없음) | `flomusic://view/fullWeb?url=https%3A%2F%2Fmusicmates.co.kr&titleBar=static&title=뮤직메이트` | 4.0 | 4.0 |

> **Push 발송 시에는 딥링크 URL에 title, titleBar 옵션을 직접 셋팅하지 말것.** "Push 제목" 항목에 채워지는 값에 따라 각각의 파라메터가 셋팅되어 딥링크에 붙여지기 때문에 별도로 URL 셋팅하면 안됨.

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/web** ?url={url}&titleBar={static\|auto\|none}&title={string} | 메인화면 웹뷰 (탭과 miniplayer가 존재함). url: 불러올 웹 URL. 실제 호출 url에는 osType={A\|I}&accessToken={token}이 추가됨. | `flomusic://view/web?url=https%3A%2F%2Fmusicmates.co.kr` | 4.0 | 4.0 |
| **view/search** ?keyword={keyword} | 검색화면으로 이동. keyword: 검색어 (없을 시 검색화면으로만 이동) | `flomusic://view/search?keyword=%EC%95%84%EC%9D%B4%EC%9C%A0` | 3.5 | 3.4.2 |
| **view/playlist** | 재생목록으로 이동 | `flomusic://view/playlist` | 3.5 | 3.4.2 |
| view/playlist?autoPlay=true | 재생목록 자동재생 | `flomusic://view/playlist?autoPlay=true` | 8.4 | - |
| view/playlist?tabIndex={tab} | 재생목록 탭 지정. ONE_SEED(빠른선곡 재생목록탭), MUSIC(재생목록탭). 생략하거나 정의되지 않은 값으로 보내면 현재 포커싱된 곡의 playlist를 보여줌 | `flomusic://view/playlist?tabIndex=ONE_SEED` | 8.5 | 8.5 |
| **view/mainPlayer** | 플레이어로 이동 | `flomusic://view/mainPlayer` | 3.5 | 3.4.2 |
| view/mainPlayer?type={contentType}&id={contentId} | type: /view/content 참고. id: 암호화된 content id | `flomusic://view/mainPlayer?type=TRACK&id=[encryptId]` | 4.2 | 4.2 |
| view/mainPlayer&url={url} | url: local audio file url (content:// or file://) | - | 4.3 | X |
| **view/mainPlayer/v2** ?type={contentType}&id={contentId} | type: /view/content 참고. id: 암호화 되지 않은 content id | `flomusic://view/mainPlayer/v2?type=TRACK&id=400007233` | 7.6 | 7.6 |
| **view/videoMainPlayer** ?id={id} | 비디오 플레이어 실행. id: 숫자로 이루어진 ID (암호화 사용하지 않음) | `flomusic://view/videoMainPlayer?id=400007233` | 4.13 | 4.13 |
| **view/discovery** ?reset={true\|false} | reset: 선택되지 않은 초기 상태로 띄움 | `flomusic://view/discovery?reset=true` | 4.3 | 4.3 |
| **view/ocrMake** | OCR 생성하기 화면으로 이동. 보관함 탭으로 이동후 캡쳐이미지로 만들기 화면이 노출된다. | `flomusic://view/ocrMake` | 6.6 | 6.6 |
| **view/ocrResult** ?ocrNo={ocrNo}&totalTrackCount={totalTrackCount} | OCR 처리 완료 시 받는 푸쉬. OCR 결과 화면 노출 (8.3.0 부터 적용) | `flomusic://view/ocrResult?ocrNo=3&totalTrackCount=1000` | 4.7 | 4.7 |
| **view/mtsResult** ?type={app\|web}&mtsNo={mtsNo}&totalTrackCount={totalTrackCount} | MTS (MultiTrackSearch - 다중곡) 검색 완료 시 받는 푸시에서 사용. MTS 결과 화면 노출 | `flomusic://view/mtsResult?type=app&mtsNo=3&totalTrackCount=1000` | 8.3 | 8.3 |
| **view/artistFlo/receive** ?characterId={characterId} | Artist Flo 팝업에서 캐릭터 받기 선택시 캐릭터 받기(복사하기) 화면으로 이동 | `flomusic://view/artistFlo/receive?characterId=12345678` | 4.7 | 4.7 |
| **view/toast** ?text={text}&noticeLevel={default\|error} | 전달받은 메세지로 토스트를 노출. noticeLevel: default(기본 알림 토스트), error(에러 토스트). AOS-IVI에서만 사용됨 | `flomusic://view/toast?text=%ED%86%A0%EC%8A%A4%ED%8A%B8` | 4.8 | 4.8 |
| **view/appSetting** | 앱 설정 화면 표시 | `flomusic://view/appSetting` | 4.14.0 | 5.7.1 |
| **view/notificationSetting** | 알림 설정 화면 표시 | `flomusic://view/notificationSetting` | 7.5 | 7.5 |
| **view/web/dialog** ?url={url}&direction={left\|right\|up} | 다이얼로그형태로 웹뷰 노출 (메인탭바 및 미니 플레이어까지 덮는 방식). direction: left(오른쪽→왼쪽, default), right(왼쪽→오른쪽), up(아래쪽→위쪽) | `flomusic://view/web/dialog?url=https%3A%2F%2Fmusicmates.co.kr` | 5.2.0 | 5.2.0 |
| **view/dislikeSetting** ?type={track\|artist} | 안듣기 설정 화면 표시. type: track(곡 안듣기), artist(아티스트 안듣기) | `flomusic://view/dislikeSetting?type=track` | 8.1 | 8.1 |
| **view/setting/alarmPlay** | Bixby 연동으로 인해 추가. 저장은하지 않고, 화면을 띄우고 값만 세팅함 | `flomusic://view/setting/alarmPlay?mode=on&hour=22&minute=13&repeatDay=3&volume=100` | 7.4 | - |

**alarmPlay 파라미터:**

| 파라미터 | 설명 |
| --- | --- |
| mode | on/off [필수] |
| hour | 0~23 [필수] |
| minute | 0~59 [필수] |
| volume | 0~100 |
| repeatDay | 요일별 값을 OR한 값: 설정안함 0x00, 일 0x01, 월 0x02, 화 0x04, 수 0x08, 목 0x10, 금 0x20, 토 0x40 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/withdraw** | 회원탈퇴화면(탈퇴사유선택화면) | `flomusic://view/withdraw` | 7.5 | - |
| **view/compareAccount** ?orderId={orderId}&memberType={memberType}&maskedMemberId={maskedMemberId} | 계정 비교 및 로그아웃 팝업 노출. 비로그인 및 비교 계정 사용 시 로그아웃 팝업 미노출 | `flomusic://view/compareAccount?orderId=17847643&memberType=IDM&maskedMemberId=duk**%40naver.com` | 7.5 | 7.5 |

**memberType:**

| type | 설명 |
| --- | --- |
| IDM | 이메일 계정 |
| MDN | 휴대폰번호 계정 |
| TID | T 아이디 계정 |
| KAKAO | 카카오 계정 |
| NAVER | 네이버 계정 |
| APPLEID | Apple ID 계정 |

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/moodon** ?contentType={type}&contentId={id}&sectionType={String}&categoryId={id} | 무드온 페이지 | `flomusic://view/moodon` | 7.6 | 7.6 |

**view/moodon 파라미터 사용방법:**

1. **파라메터를 추가하지 않은 경우**: 무드온 페이지 기본 형태로 진입
2. **categoryId만 추가한 경우**: 상황 필터가 선택된 형태로 페이지 진입으로 상황에 대한 ID값. categoryId 외에 다른 파라메터가 겹치면 안됨
   - ex) `flomusic://view/moodon?categoryId=10`
3. **contentType, contentId, sectionType 세가지를 추가한 경우**: 세가지 파라메터가 세트로 구성되며, 하나라도 누락될 경우 기본 무드온 페이지로 진입
   - **contentType**은 "CHNL" 하나만 서버에서 처리 가능함
   - **sectionType**: SHARE(딥링크 진입), CURATION(홈 큐레이션 진입)
   - ex) `flomusic://view/moodon?contentType=CHNL&contentId=19003&sectionType=CURATION`

> **주의사항**: 반드시 위 1,2,3 케이스에 맞춰서 딥링크 규격을 만들어주세요. 규격에 맞지 않게 API를 호출하게 되면 에러페이지가 노출 됩니다.

**App 예외처리:**
- 모든 파라메터의 값이 들어오게 될 경우 3번 케이스를 우선 처리
- categoryId + contentType OR categoryId + contentId 와 같이 조합이 되지 않는 파라메터가 들어오게 되면 조합이 되는 categoryId만 처리
- contentType, contentId, sectionType이 함께 들어 오지 않을 경우 1번으로 처리

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **view/myBadge** | 나의 배지 | `flomusic://view/myBadge` | 25.110.0 | 25.110.0 |

### action

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **action/popup** ?type={type}&url={url} | 클라이언트 팝업 호출. type: webview(웹뷰 팝업). url: 웹뷰 팝업의 url 정보. 실제 호출 url에는 osType={A\|I}&accessToken={token}이 추가됨. | `flomusic://action/popup?type=webview&url=https%3A%2F%2Fmusicmates.co.kr` | 3.5 | 3.5 |
| &enableScroll={true\|false} | 스크롤 지원 여부. 기본값:false (AOS only) | - | 3.5 | X |
| **action/benefit/voucher** ?benefitType={type}&voucherId={id} | 무료 이용권 발급 | `flomusic://action/benefit/voucher?benefitType=TLFE&voucherId=1234` | - | - |
| **action/openUrl** ?url={url} | 외부 url 호출. url: 불러올 웹 URL지정. 실제 호출 url에는 OS에 따라 osType={A\|I}을 추가 (accessToken은 추가하지 않음). **URL 인코딩 필수** | `flomusic://action/openUrl?url=https%3A%2F%2Fmusicmates.co.kr` | 4.0 | 4.0 |
| **action/initPopup** ?id={popupId} | init popup list 리스트에서 해당하는 팝업을 조회해서 화면에 보여준다 | `flomusic://action/initPopup?id=12334567` | 4.7예정 | 4.7예정 |
| **action/login/qr** | Qr로그인. 비로그인시 로그인 후 진행 | `flomusic://action/signin/qr?token=1234&clearChildScreen=false` | 7.8 | 7.8 |
| **action/apptoappLogin** | 앱투앱 로그인 (Ticket → Music). 비로그인 또는 7.9.1 이하에서 팝업 노출 | `flomusic://action/apptoappLogin` | 7.9.1 | 7.9.1 |

### play

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **play/track/** ?ids={ids}&repeat={all\|one\|off}&shuffle={on\|off}&autoPlay={true\|false} | 재생. ids: track id들 (쉼표로 구분). autoPlay: false면 재생목록에만 담음 (default: true) | `flomusic://play/track?ids=30598121,433090157,433468306&repeat=all&shuffle=on&autoPlay=false` | 7.2 | 7.2 |
| **play/quickplay** ?trackId={id}&familiarity={type}&autoPlay={true\|false}&isOpen={true\|false} | 빠른선곡 재생 스킴 | `flomusic://play/quickplay?trackId=30598121&familiarity=novel&autoPlay=true&isOpen=true` | 8.6 | 8.6 |

**play/quickplay 파라미터:**

| 파라미터 | 설명 | 필수 | 기본값 |
| --- | --- | --- | --- |
| trackId | 트랙 id | required | - |
| familiarity | 친숙도 필터: novel, balanced, familiar | optional | balanced |
| autoPlay | 자동재생 여부 | optional | true |
| isOpen | 재생목록 화면 노출 여부 | optional | false |

---

## WebView 전용 Scheme

### action

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **action/alert** ?title={title}&message={message}&okCallback={function}&okText={okText} | 클라이언트 alert 창 호출. title: 기본값 title영역 미표시. message: 필수. okCallback: 기본값 대화상자 닫음. okText: 기본값 "확인" | - | 3.2 | 3.2 |
| **action/confirm** ?title={title}&message={message}&okCallback={function}&cancelCallback={function}&okText={okText}&cancelText={cancelText} | 클라이언트 confirm 창 호출. title: 기본값 title영역 미표시. message: 필수. okText: 기본값 "확인". cancelText: 기본값 "취소" | `flomusic://action/confirm?message=Really%3F&okCallback=deleteItem&okText=Delete&cancelText=Cancel` | 3.2 | 3.2 |
| &cancelToNeutral={true\|false} | cancel버튼 neutral로 취급. 기본값: false (AOS only). 대화상자 바깥쪽이나 back키 터치시 cancelCallback이 호출되지 않음 | - | 3.5 | - |
| &type={alert_cancel_voucher} | confirm 창 유형. alert_cancel_voucher: 이용권 해지 확인. Rake 로그 남김 | - | 4.3예정 | 4.3예정 |
| **action/close** | client 닫기 | - | 3.2 | 3.2 |
| **action/accessToken** ?success={function(token)}&fail={function(message)} | access 토큰을 갱신한다. success: 토큰을 받을 콜백 함수. fail: 실패시 호출됨. | `flomusic://action/accessToken?success=onAccessTokenSuccess&fail=onAccessTokenFail` | 4.0 | 4.0 |
| **action/purchase/complete** ?passNm={String} | 이용권 구매 완료시 구매 이용권 이름 알려줌. passNm: 이용권 이름 | - | 3.5 | X |
| **action/login** | 로그인 화면을 띄우고, 로그인 완료시 accessToken을 URL에 추가하여 화면을 새로 로드한다 | - | 4.0 | 4.0 |
| **action/userInfo** ?success={function(memberNo, characterNo)}&fail={function(message)} | 로그인한 User의 memberNo, characterNo를 얻어온다. fail: 로그인하지 않은 경우 호출 | - | 4.14.0 | 4.14.0 |
| **action/adid** ?success={function(adid)}&fail={function(message)} | adid를 얻어온다 | - | 4.0 | 4.0 |
| **action/afid** ?success={function(afid)}&fail={function(message)} | afid (앱스플라이어 ID)를 얻어온다 | - | X | 4.11.0 |
| **action/idfv** ?success={function(idfv)}&fail={function(message)} | idfv (Device의 VenderID)를 얻어온다 | - | X | 6.4 |
| **action/att** ?success={function(att)} | att (iOS 14이상에서 앱 추적 동의 여부)를 얻어온다. 값: Y, N | - | X | 6.4 |
| **action/aie** ?success={function(aie)} | aie (iOS 13이하에서 광고 ID 허용 여부)를 얻어온다. 값: Y, N | - | X | 6.4 |
| **action/osversion** ?success={function(osversion)} | os version을 얻어온다. 값 예시: 15.0.1 | - | 6.4 | 6.4 |
| **action/sendLog** ?rakePage={string}&rakeCategory={string}&rakeAction={string}&rakeBody={json string}&adbrixActivity={string}&adbrixParam={string}&fbEvent={String}&fbParams={json string} | 로그 전송. 여러가지 로그를 동시에 보낼 수 있으며 비정상적인 파라미터 조합들은 무시됩니다. Rake(page, category, action, body), Adbrix(activity, param), FaceBook(event, params) | - | - | - |
| **action/shareSns** ?type={SNS}&imageUrl={encodedURI(url)}&text={text}&minAppVer=5.5.0 | SNS에 feed로 공유한다. type: instagram, facebook, twitter. 참고: 인스타그램은 이미지 공유만 가능 | - | 5.5.0 | 5.5.0 |
| **action/shareImage** ?type=instagram&imageUrl={encodedURI(url)} | 인스타그램에 이미지를 Feed로 공유 | - | 4.11.0 | 4.11.0 |
| **action/saveImage** ?type=gallery&imageUrl={encodedURI(url)} | 이미지를 Gallery로 저장 | - | - | - |
| **action/authResult** ?authType={APPLEID\|NAVER}&token={string}&error={string} | 소셜인증 결과 (/view/fullWeb에서만 사용 가능). authType: APPLEID(AOS Only), NAVER(iOS Only). token: 로그인 성공시 snsAccessToken. error: 로그인 실패시 에러코드 | `flomusic://action/authResult?authType=APPLEID&token=xxxxxxx&error=user_cancelled_authorize` | 4.14.0 | 7.6 |
| **action/successSignIn** ?accessToken={string}&refreshToken={string}&memberNo={memberNo}&characterNo={characterNo}&popUpClause={true\|false} | 로그인 완료. characterNo: 선택된 캐릭터. popUpClause: 추가 약관 동의 필요 여부 | - | IVI | - |
| **action/oneStore** ?productId={productId}&payload={payload}&productType={productType} | 원스토어 결제하기. productType: ALL="all", INAPP="inapp", AUTO="auto" | - | - | - |
| **action/appUpdate** | FE에서만 app업데이트 팝업을 띄울때 본 action을 호출함. 앱에서는 정의되지 않은 스킴을 받을 경우, 앱 업데이트 팝업을 띄우게 되어있음 | - | - | - |
| **action/archiveCookies** | 현재 쿠키들을 앱에 보관합니다. 앱 재실행 시 이때 보관 된 쿠키들이 유지됩니다. | iOS only | X | 8.2 예정 |

### file (/view/fullWeb에서만 사용 가능, AOS only)

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **file/select** ?acceptType={type}&success={function(path)}&fail={function(message)} | 클라이언트 파일 선택창 호출 (AOS only). acceptType: 파일 유형 (현재는 무시되며 항상 이미지 파일만 선택 가능) | - | 3.2 | X |
| **file/upload** ?url={url}&parameters={encodedQueryParameter}&files={encodedQueryParameter}&success={function()}&fail={function(message)} | 파일 업로드 (AOS only). url: MultiPart post가 가능한 API url. parameters: name1=value1&name2=value2 형식. files: name1=path1&name2=path2 형식 | - | 3.2 | X |

### gallery (iOS Only)

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **gallery/permission** ?success={function()}&fail={function(message)} | iOS에서 사진 접근권한을 얻어온다 | iOS Only | X | 6.2 |

### Web에 데이터 전달 (범용)

| path | 설명 | 예제 | Android | iOS |
| --- | --- | --- | --- | --- |
| **action/requestData** ?name={name}&params | 웹에서 action/requestData uri를 호출. name 파라메터 필수. 클라이언트에서는 name에 따라 웹에서 원하는 데이터를 json에 담아 `callbackAppSchemeInWebview` 자바스크립트 호출 | - | 6.2 | X |

**callbackAppSchemeInWebview JSON 포맷:**

```json
{
  "name": "...",
  "path": "...",
  "param": {
    // name을 제외한 param
  },
  "data": {
    // ...
  }
}
```
