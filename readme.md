# Claude Code in Action


# part1

Anthropic Academy というプラットフォームのコース

- コーディングアシスタントとは
- なぜ Claude Code
- Claude Code をパートナーとしてともに働く
- Getting the most out of Claude Code : Claude Code を最大限に活用する

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

email のような PII (Personally Identifiable Information) が含まれてしまった