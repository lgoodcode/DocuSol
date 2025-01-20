import Image from "next/image";
import { Plus, Info, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-black to-[#3B1111] pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-transparent via-purple-900/20 to-purple-800/30 pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 overflow-auto relative">
        <div className="relative">
          {/* Hero Section */}
          <section className="relative grid md:grid-cols-2 min-h-[85vh]">
            {/* Left Column */}
            <div className="p-8 md:p-16 flex flex-col relative z-10">
              <div className="flex items-center mb-4">
                <span className="bg-purple-900/30 text-purple-400 px-2 py-1 text-sm font-medium">
                  Beta
                </span>
              </div>

              <div className="space-y-8">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-br from-purple-900 to-purple-500 bg-clip-text text-transparent dark:from-purple-500 dark:to-purple-100">
                  DocuSol
                  <br />
                  Share on the blockhain
                  <br />
                  Share securely encryption
                </h1>

                <p className="text-gray-400 text-lg">
                  Welcome your new WorkOS, here to fill your skill gaps and
                  amplifying your skill-set.
                </p>

                <div className="flex items-center">
                  <div className="flex -space-x-3">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-black bg-gray-800"
                      />
                    ))}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-400">Loved by</p>
                    <p className="font-semibold">32,000+ users</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Startup Grants from</p>
                  <div className="flex items-center gap-4">
                    <Image
                      src="/svg/microsoft.svg"
                      alt="Microsoft"
                      width={120}
                      height={48}
                      className="invert"
                    />
                    <span className="text-gray-600">•</span>
                    <Image
                      src="/svg/openai.svg"
                      alt="OpenAI"
                      width={120}
                      height={48}
                      className="invert"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="relative border-t md:border-t-0 md:border-l border-stone-800 bg-black/40">
              <div className="p-8 md:p-16 relative z-10">
                <Tabs defaultValue="agent" className="w-full">
                  <TabsList className="w-full justify-start bg-black/50 rounded-full p-1 mb-8">
                    <TabsTrigger
                      value="agent"
                      className="rounded-full data-[state=active]:bg-stone-800/50"
                    >
                      Agent
                    </TabsTrigger>
                    <TabsTrigger
                      value="document"
                      className="rounded-full data-[state=active]:bg-stone-800/50"
                    >
                      Document
                    </TabsTrigger>
                    <TabsTrigger
                      value="chat"
                      className="rounded-full data-[state=active]:bg-stone-800/50"
                    >
                      Chat
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="agent" className="space-y-6">
                    <div>
                      <p className="text-sm mb-2 text-gray-400">Templates</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "SEO Writer",
                          "Start-up Podcast",
                          "Competitor Analysis",
                          "Market Segmentation",
                          "Travel Planner",
                        ].map((template) => (
                          <Button
                            key={template}
                            variant="outline"
                            size="sm"
                            className="rounded-full bg-transparent border-stone-800/50 hover:bg-stone-800/50"
                          >
                            {template}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full bg-transparent border-stone-800/50 hover:bg-stone-800/50"
                        >
                          See More
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          Agent Conversation Name
                        </label>
                        <Input
                          placeholder="ResearchAI (max 255 chars)"
                          className="bg-black/50 border-stone-800/50 rounded-xl focus-visible:ring-stone-700 h-12"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-400">
                          Language Model
                        </label>
                        <Select>
                          <SelectTrigger className="w-full h-12 bg-black/50 border-stone-800/50 rounded-xl">
                            <SelectValue placeholder="GPT-3.5 — Fast" />
                          </SelectTrigger>
                          <SelectContent className="bg-black border-stone-800">
                            <SelectItem
                              value="gpt3.5"
                              className="focus:bg-stone-800"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span>GPT-3.5 — Fast</span>
                              </div>
                            </SelectItem>
                            <SelectItem
                              value="gpt4"
                              className="focus:bg-stone-800"
                            >
                              GPT-4 — Smart
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">Goal</label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 hover:bg-transparent"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Develop a social media strategy for my business"
                          className="min-h-[100px] bg-black/50 border-stone-800/50 rounded-xl focus-visible:ring-stone-700"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="search" />
                        <label
                          htmlFor="search"
                          className="text-sm text-gray-400"
                        >
                          Search enabled
                        </label>
                      </div>

                      <Button className="w-full h-12 bg-[#2D1562] hover:bg-[#1D0D42] text-white">
                        Create Agent
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </section>

          {/* What is AIAgent.app? */}
          <section className="border-t border-stone-800">
            <h2 className="text-center p-4 text-lg font-semibold border-b border-stone-800">
              What is AIAgent.app?
            </h2>
            <div className="max-w-2xl mx-auto my-32 text-center px-8">
              <p className="text-gray-400 mb-4">AIAgent.app is</p>
              <h3 className="text-2xl font-semibold">
                A web app that makes choices and performs tasks on its own,
                based on the goals set by you.
              </h3>
            </div>
          </section>

          {/* How Does it Work? */}
          <section className="border-t border-stone-800">
            <h2 className="text-center p-4 text-lg font-semibold border-b border-stone-800">
              How Does it Work?
            </h2>
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-16">
              <div className="space-y-4">
                <p className="text-gray-400">An AI Agent works by</p>
                <h3 className="text-3xl font-semibold">
                  Breaking down your goal into smaller tasks and completing them
                  one by one.
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="bg-red-900/30 p-2 w-fit rounded-lg">
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 17L17 7M7 7h10v10"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold">1. Execute</h4>
                  <p className="text-sm text-gray-400">
                    The execution agent performs the top task. (Input to the
                    flow is a goal with a task of creating a todo list)
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-green-900/30 p-2 w-fit rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold">2. Create</h4>
                  <p className="text-sm text-gray-400">
                    The task creator agents creates any more tasks needed to
                    achieve the goal
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-orange-900/30 p-2 w-fit rounded-lg">
                    <svg
                      className="w-6 h-6 text-orange-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold">3. Prioritize</h4>
                  <p className="text-sm text-gray-400">
                    The prioritisation agent re-prioritises the tasks to make
                    sure the next execution is done on the most important task
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="bg-blue-900/30 p-2 w-fit rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold">4. Iterate</h4>
                  <p className="text-sm text-gray-400">
                    This process repeats until there are no remaining tasks and
                    the goal is complete!
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="border-t border-stone-800">
            <h2 className="text-center p-4 text-lg font-semibold border-b border-stone-800">
              Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-4 p-4">
              <div className="bg-orange-900/20 p-8 md:p-16 relative overflow-hidden rounded-xl">
                <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl font-semibold text-orange-300">
                    AI Ensemble
                  </h3>
                  <p className="text-orange-200">
                    Run multiple AI Agents at once, operating concurrently to
                    bolster your business processes and optimize your workflow.
                  </p>
                </div>
                <Image
                  src="/img/multiple-agents.png"
                  alt="AI Ensemble visualization"
                  width={400}
                  height={300}
                  className="absolute bottom-0 right-0 object-contain opacity-30"
                />
              </div>
              <div className="space-y-4">
                <div className="bg-purple-900/20 p-8 md:p-16 rounded-xl">
                  <h3 className="text-2xl font-semibold text-purple-300">
                    GPT-4 for all
                  </h3>
                  <p className="text-purple-200">
                    Democratize access to cutting-edge technology with our AI
                    agents. Experience the power of GPT-4, available to
                    everyone, fueling innovation across the board.
                  </p>
                </div>
                <div className="bg-yellow-900/20 p-8 md:p-16 relative rounded-xl">
                  <div className="relative z-10">
                    <h3 className="text-2xl font-semibold text-yellow-300">
                      Keys Included
                    </h3>
                    <p className="text-yellow-200">
                      No keys, no worries we&apos;ve got you covered, just enjoy
                      a streamlined approach AI Agents.
                    </p>
                    <Image
                      src="/img/keys.png"
                      alt="OpenAI API Keys"
                      width={400}
                      height={300}
                      className="absolute bottom-0 right-0 object-contain opacity-30"
                    />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 bg-stone-900/50 p-8 md:p-16 rounded-xl">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-gray-200">
                    Crystal Clear Code
                  </h3>
                  <p className="text-gray-400">
                    Featuring inline code blocks with syntax highlighting that
                    elevates your coding experience to new heights of clarity.
                  </p>
                  <Image
                    src="/img/code.png"
                    alt="OpenAI"
                    width={120}
                    height={60}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  />
                </div>
              </div>
              <div className="md:col-span-2 bg-green-900/20 p-8 md:p-16 rounded-xl">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="bg-black/20 text-gray-400"
                  >
                    COMING SOON
                  </Badge>
                  <h3 className="text-2xl font-semibold text-green-300">
                    Algorithmic All-Stars
                  </h3>
                  <p className="text-green-200">
                    Tap into a colorful array of AI personalities, each powered
                    by distinct algorithms designed to enrich your business.
                  </p>
                  <div className="flex gap-8 mt-8">
                    <Image
                      src="/img/algo.png"
                      alt="OpenAI"
                      width={120}
                      height={60}
                      className="opacity-50 hover:opacity-100 transition-opacity"
                    />
                    <div className="flex items-center justify-center w-[120px]">
                      <div className="w-10 h-10 rounded-full border-2 border-green-500/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-green-500/60" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 bg-[#1A3B4B] p-8 md:p-16 rounded-xl relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  <h3 className="text-2xl font-semibold text-white">
                    World Wide Surfer
                  </h3>
                  <p className="text-gray-200">
                    With internet access your AI Agents can navigate the World
                    Wide Web, seamlessly guiding you through a realm of infinite
                    possibilities.
                  </p>
                </div>
                <div className="absolute inset-0 opacity-20">
                  <Image
                    src="/img/web.png"
                    alt="Grid wireframe background"
                    width={400}
                    height={300}
                    className="translate-y-1/4"
                  />
                </div>
              </div>

              <div className="md:col-span-1 bg-[#3B1111] p-8 md:p-16 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                  <Badge
                    variant="secondary"
                    className="bg-black/20 text-gray-400"
                  >
                    ALPHA
                  </Badge>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Read, Write, and Rule Your Files
                  </h3>
                  <p className="text-gray-200">
                    Our AI Agents can read and write, effortlessly handling your
                    files and streamlining your document workflows.
                  </p>
                </div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[url('/img/topographic.png')] bg-no-repeat bg-cover opacity-50" />
                </div>
              </div>

              <div className="md:col-span-1 bg-[#1A1A1A] p-8 md:p-16 rounded-xl relative overflow-hidden">
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 text-sm bg-black/20 rounded-full text-gray-400 mb-4">
                    COMING SOON
                  </span>
                  <h3 className="text-2xl font-semibold text-white mb-4">
                    Party with 3rd Parties
                  </h3>
                  <p className="text-gray-200">
                    Celebrate seamless collaboration as our AI Agents
                    effortlessly integrate with third-party platforms, forging
                    powerful alliances and enhancing your digital ecosystem.
                  </p>
                </div>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[url('/img/third-party.png')] bg-no-repeat bg-cover opacity-50" />
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-stone-800">
            <h2 className="text-center p-4 text-lg font-semibold border-b border-stone-800">
              Frequently Asked Questions
            </h2>
            <div className="max-w-4xl mx-auto p-8">
              <div className="grid gap-4">
                {[
                  "What are AI Agents?",
                  "What's the difference AiAgent.app and ChatGPT?",
                  "What's the difference AiAgent.app and AutoGPT?",
                  "What's the difference AiAgent.app and babyAGI?",
                  "Is AiAgent.app free to use?",
                ].map((question) => (
                  <button
                    key={question}
                    className="w-full text-left p-4 rounded-full border border-stone-800 hover:bg-stone-900"
                  >
                    <p className="font-semibold">{question}</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Call To Action */}
          <section className="border-t border-stone-800">
            <h2 className="text-center p-4 text-lg font-semibold border-b border-stone-800">
              Your Call To Action
            </h2>
            <div className="h-screen flex items-center justify-center">
              <div className="text-center space-y-8">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">
                  Start Your AI Journey Today
                </h2>
                <p className="text-xl text-gray-400">
                  Empower your workflow with AI Agents and unlock new levels of
                  productivity.
                </p>
                <Button
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Get Started for Free
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
