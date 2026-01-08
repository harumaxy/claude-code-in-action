# Claude Code in Action


# part1

Anthropic Academy というプラットフォームのコース

- コーディングアシスタントとは
- なぜ Claude Code
- Claude Code をパートナーとしてともに働く
- Getting the most out of Claude Code : Claude Code を最大限に活用する

# Getting Hands On

## コーディングアシスタントとは

タスクを振る仕組み

1. プロンプトでタスクを与える。 ex. `エラーが出たので修正法を探して。エラーはこれです Can not read property 'records' of undefined`
2. LLM が以下を繰り返す
   1. コンテキストを集める
   2. formulate a plan = プランを練る
   3. アクションを実行
3. LLM は Set of tools をもつ

コンテキストを集めるとは、\
エラーがどのコードベース部分に影響を受けている、関連しているファイルがあるかなどを調べること

LLMは外部世界との対話をする必要がある\
コンテキスト収集 = Read File, Search Web, Ask User\
アクション実行 = Write File, Run Tests, ...



## LLM のツール使用

LLM はドキュメント補完エンジンであり、`テキストを入出力する`ことしか出来ない\
実際は、Coding Assistant プログラムによってプロンプトに `ReadFile: main.go` のようなツール指示が自動で追加され、処理される

User: main.go には何が書かれている\
Coding Assistant: main.goには何が書かれている？もしファイルを読みたければ, `ReadFile: main.go` とともに応答して\
LLM `ReadFile: main.go`  -> Coding Assistant `ファイル内容` -> LLM
LLM: 内容を説明します。...




Claude のLLM (Opus, Sonnet, Haiku) はツールを理解し複雑なタスクの実行を特に得意とする


## Claude Code の特徴

- Claude はツールを組み合わせて複雑な作業を完了しようとする
- Claude は使ったことのないツールを熟練しているように使える
- tool は追加可能
- tool で特有のワークフローをカスタマイズ可能
- tool 追加によってAIならではの高速な変更ができる
- 強力なツールによりコードベースのナビゲーションが可能
- Claude Code は codebase のインデックス化に頼らない
  - コードベース全体を外側のサーバーに頻繁に送るようなことを必要としない (セキュリティ的に良い)


## Tools With Claude Code

複数のツールが内蔵されている

- Agent : サブエージェントを開始
- Bash
- Edit : ファイル編集
- Glob : パターンでファイル検索
- Grep : 内容でファイル検索
- LS　：List files in a directory
- MultiEdit : 複数ファイル編集
- Read/Write
- TodoRead/Write
  - Todo とは？
- WebFetch
- WebSearch


- Jupyter Notebook 関連
  - NotebookEdit
  - NotebookRead

### 例
- JS の `chalk` ライブラリのパフォーマンス改善s
- `streaming.csv` ファイルを与え得て、 Jupyter Notebook でコードを書きデータ分析を行う
  - 様々なセルでデータを出力する
- React Component Generator


#### UI Styling Task

React Component Generatorの例を改善する例。\
単純にスタイルがしょぼい状態で作ってある

User: アプリのデザインを向上したいです。チャットインターフェイスとヘッダーに焦点を当てて下さい。
Playwright MCP Server: Claude にブラウザコントロールのためのツールセットを提供します

Claude Code:
1. ブラウザを開く
2. アプリに行く
3. スクリーンショットを取る
4. スタイルを更新する


#### Github integration

User: PR の変更をレビューして
Github MCP Server: Claude に Github リポジトリを操作するためのツールセットを提供します

Claude Code:
1. PR の変更を確認する
2. コードクオリティやパフォーマンスを調査
3. サマリーレポートを書く

`Github Actions` で Claude Code を実行することも可能。\
メンションやタグ, PR作成などでトリガー可能


### IaC with Claude Code

- Terraform で管理されている
  - Claude Code は Terraform ファイルのようなテキストベースの構成ファイルを理解するのが得意
- DynamoDB書き込み => Lambda => S3Bucket 保存 -> 内部マーケティングチーム、外部マーケティングパートナーに共有

email のような PII (Personally Identifiable Information) が含まれてしまった。\
Claude は PR でそれを検出して指摘することができる



## 実際のプロジェクトで働く

### コンテキスト管理

LLM と作業する場合、注目すべきコンテキストを含めないと性能が落ちる。\
プロジェクトの数百ファイルなど含まれることがあるが、必要な情報だけを暗証するように誘導する。


### 作業s

1. 最初は `/init` コマンド
  - コードベース全体を解析する。アーキテクチャと目的を理解
  - 重要なコマンド、ファイルを見つける
  - コーディングパターンと構造を理解する
2. `CLAUDE.md` ファイルが作成される


### CLAUDE.md
CLAUDE.md は、プロジェクト内での `claude` コマンドのプロンプト全てに含まれる。\
永続的なシステムプロンプトを書くようなもの

- 重要なコマンド、アーキテクチャ、コーディングスタイルを CLAUDE にガイドする
- 特定の指示やカスタム指示を与える

### 3つの CLAUDE.md

- CLAUDE.md : `/init` で作成され、git に含まれるべきで、すべてのエンジニアに共有されるべき
- CLAUDE.local.md  : 他のエンジニアに共有しないが、自分だけに適用。.gitignore 推奨
- ~/.claude/CLAUDE.md : すべてのプロジェクトに適用

### カスタム命令の追加

`#` コマンドでメモリーモードに入れるらしい？\
試したが出来なかった。\
Claude.md を claude code 経由でインタラクティブに編集するらしい

直接編集したほうが速い

## @ でファイルをメンション

特定ファイルを参照する

### CLAUDE.md で @ を使用する

プロジェクトの多くの側面に関連するファイルは、 `CLAUDE.md` 内で @ を使ってメンションすることもできる\
毎回参照しなくても自動で含まれるようになるのですぐ質問できる。


## CLAUDE の知能を上げる方法

Planning Mode:\
`Shift + Tab` x2 で有効化する\
コードベース広範な調査をする複雑なタスクは、 agent モードで実際に編集する前に行っておくと正確性が上がる。

Thinking Mode:\
多くの予算を使って思考を強化する。\
トリガーフレーズによって有効化される\
強度がある
- Think
- Think more
- Think a lot
- Think longer
- Ultrathink

### Plan と Think の併用
Plan = コードベースの参照の広さ
Think = 深さ

広さと深さを両方必要とする場合は併用する\
コストは上がる。

## Context の制御

例えばサンプルプロジェクトの src/lib/auth.ts をテストしたい\
しかしこのファイルは複雑すぎて、AIにテストさせようとするとスタックする

とりあえずスタックしたら `Esc` で中断しよう


### より制御されたコンテキスト

まず、ファイルの中に何があるかを認識させる

```
whats in the @../src/lib/auth.ts ? 
>
- createSession
- getSession
- deleteSession
- verifySession
```

特定の関数のテストだけ書かせる\
(1度に一つずつ。たくさんコンテキストが混ざると馬鹿になる)

```
write test for createSession function
```

続けて他の関数のテストも書きたいが、例えば `インストールし忘れてたコードのせいでバグが出た`、`それを直した`\
といったコンテキストは他のテストに関係ないので無駄

`Esc x2` で会話履歴を見れる\
任意のメッセージに移動して以前のコンテキストに戻れる\
無駄な部分を忘れてまたプロンプト

```
write test for getSession function
```

ただし、テストを書く途中で今後に役立つ思考が発生した場合は、\
それを記憶しつつコンテキストを圧縮して性能を回復したい\
`/compat` でコンテキストを要約して圧縮する

全く異なるタスクに移りたい場合は `/clear` ですべてのコンテキストを忘れる

- Esc : 会話を中断。 `#`メモリーモードで情報の修正を入れて、続けることも可能
- Esc x2 : 会話履歴を表示。任意のメッセージ・コンテキスト状態に戻れる
- `/compat` : コンテキストを圧縮。記憶を維持しつつ性能を回復
- `/clear` : すべてのコンテキストをクリア。まっさらなコンテキストで別のタスクへ

タイミングよく使用することで、無限スタックを回避\
AIにも集中力と記憶があることを意識

> これらの会話制御テクニックは、特に次のような場合に役立ちます。
> 
> 文脈が混乱する可能性がある長時間の会話
> 以前のコンテキストが邪魔になる可能性があるタスクの遷移
> クロードが同じミスを繰り返している状況
> 特定のコンポーネントに焦点を合わせ続ける必要がある複雑なプロジェクト

## Custom Command

Claude のスラッシュコマンドを自分で作れる。\
繰り返しタスクに便利

1. `.claude/commands/{command-name}.md` に markdown ファイルを作成
2. ファイル内に自然言語で実行内容・コマンドを書く
3. claude を起動して `/command-name` を実行


### Custom Command で引数を受け取る

`$ARGUMENTS` プレースホルダを使用して引数を受け取れる
(他の文字列でも行ける)

正確なパスを指定する必要はない。CLAUDE.md  にプロジェクト構成が書いてあればそれを参照するし、Claude Code は `glob` ツールを持っている

`Search(pattern: "**/hooks/**/use-auth.ts")`

```
/write_tests the use-auth.ts file in the hooks directory 
```

### 例

.claude/commands
  - audit.md : npm audit を実行し、脆弱性のある依存関係があったら audit fix を実行して更新する
  - write_tests.md : $ARGUMENTS でファイルを指定(厳密にはファイル名でなくて、関数名とかでもいい？)。
    - 使用するフレームワーク指定(Vitest)
    - カバレッジ指定(正常系、エッジケース、エラーステート、など)
    - 実装詳細ではなく振る舞いに焦点を当てる
      - などの注意点を指定してテストを書ける


## MCP Server をインストールする

Model Context Protocol サーバー\
リモートサーバーと、stdin/out経由で接続するローカル実行ファイルの2種類がある。\
(開発ツールは後者が主流?)



### Playwright MCP を Claude Code にインストールする


```sh
claude mcp add playwright npx @playwright/mcp@latest
# claude mcp add <mcp-server-name> <commands...>
```

また、MCPのツールを使うには許可が聞かれる\
`.claude/settings.local.json` に追加される

```json
{
  "permissions": {
    "allow": [
      "Bash(npm test:*)",
      "Bash(npm audit:*)",
      "Bash(npm ls:*)",
      "Bash(cat:*)",
      "Bash(npm install:*)",
      "Bash(npm run build:*)",
      "Bash(lsof:*)",
      "mcp__playwright
    ]
  }
}

```

毎回聞かれるのが嫌な場合、ここを手動で編集して追加してもいい。\
権限は前方一致なので、 `mcp__playwright` と書いておけば playwright mcp のすべてのツールが許可される

## その他のMCPサーバーを探索探索

- DB インタラクション
- APIテスト、監視
- ファイルシステム操作
- クラウドサービス統合
- 開発ツール自動化